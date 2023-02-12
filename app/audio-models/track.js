import Model from '@ember-data/model';
import Evented from '@ember/object/evented';

import ENV from '../config/environment';
import { difference } from '../utils/arrays-equal';
import {
  addCustomSelector,
  bindSourcenodeToLoopStep,
  getCrackedNode,
  unbindFromSequencer,
} from '../utils/cracked';
import filterNumericAttrs from '../utils/filter-numeric-attrs';
import { tracked } from '@glimmer/tracking';
import TrackControlModel from '../models/track-control';
import { inject as service } from '@ember/service';
import { FILE_LOAD_STATES } from '../models/track-node';
import { set } from '@ember/object';

export default class TrackAudioModel extends Model.extend(Evented) {
  @tracked nodeToVisualize;
  @service store;

  // serialize 2d array of track control values to use in scripts
  get trackControlData() {
    return this.trackControls.map((trackControl) => {
      // FIXME when user switches a control from single to multi, both values will be truthy/
      // need an 'activeValue' that switches with it
      if (trackControl.get('controlArrayValue.length')) {
        return trackControl.get('controlArrayValue');
      }
      return trackControl.get('controlValue');
    });
  }

  /**
   *
   */
  setNodeToVisualize() {
    const firstVisualizableNode = this.settingsForNodes.find(
      (audioNode) => audioNode.userSettings?.id == 'main-output'
    );

    const node = __._getNode(firstVisualizableNode?.uuid)?.getNativeNode();
    this.nodeToVisualize = node;
  }

  async downloadSample() {
    if (this.filepathUrl) {
      await fetch(this.filepathUrl)
        .then((res) => res.blob()) // Gets the response and returns it as a blob
        .then((blob) => {
          this.localFilePath = URL.createObjectURL(blob);
        });
    }
  }

  async setupAudioFromScripts(unbindBeforeCreate = true) {
    const initScript = await this.initScript;
    await this.trackControls;

    // settingsForNodes is an array to store audio node uuids created in this track's script
    // not to be confused with trackNode models,
    // { uuid: type, atts: { filename: '...', speed: 1} }
    set(this, 'settingsForNodes', []);

    // cracked.onCreateNode was added to the Cracked library to give access to the AudioNode object upon creation
    // this callback gets called when a user creates cracked audio nodes in the script editor ui
    // macro components should not get individual ui controls
    __.onCreateNode = async (node, type, creationParams, userSettings) => {
      const nodeSettings = {};

      const uuid = node.getUUID();
      nodeSettings[uuid] = type;
      nodeSettings.nodeType = type; // used to find orphaned nodes
      nodeSettings.uuid = uuid;
      nodeSettings.userSettings = userSettings; // save the initialization attributes so they can be used to update TrackControl's min/max/default param values
      nodeSettings.parentMacro = node.isMacroComponent()
        ? __._getNode(node.getMacroContainerUUID())
        : null;

      if (ENV.APP.supportedAudioNodes.indexOf(type) > -1) {
        // add a track-specific class to every node created so it can be
        // easily selected and properly cleaned up. addCustomSelector sets these in
        // the Cracked store
        const indicator = this.isMaster ? 'master' : this.order;
        addCustomSelector(node, `.track-${indicator}`);
        addCustomSelector(node, `${type} .track-${indicator}`);
        this.settingsForNodes.push(nodeSettings);
        if (userSettings) {
          // callback is a custom addition to cracked library that
          // fires when audio file loads
          userSettings.callback = async ({ buffer, error }) => {
            this.trackNodes.then((_store) => {
              const trackNode = _store.findBy('nodeUUID', node.getUUID());
              if (this.trackNodes.isFulfilled && trackNode) {
                if (buffer) {
                  trackNode.fileLoadState = FILE_LOAD_STATES.SUCCESS;
                }
                if (error) {
                  trackNode.fileLoadState = FILE_LOAD_STATES.ERROR;
                }
              }
            });
          };
        }
        // 'ui' is a custom attr that users can set in the script editor when defining a cracked audio node
        // new AudioNode objects won't get initialized with it by default so we hack it on here
        // see cracked.js line 330
        if (userSettings?.ui) {
          node.ui = userSettings.ui;
        }
      }
    };

    if (unbindBeforeCreate) {
      this.unbindAndRemoveCrackedNodes();
    }

    // run script to create audio nodes
    initScript.invokeFunctionRef();
    // nullify this callback after creating track nodes to prevent it from getting called outside of this track
    __.onCreateNode = null;
    let trackNodes = this.cleanupNodeRecords();

    trackNodes = this.findOrCreateTrackNodeRecords();
    this.setupTrackControls(trackNodes); // need to wait to make sure we have filepath

    if (this.currentSequence) {
      if (trackNodes.length) {
        let onStepCallback = this.onStepCallback.bind(this);
        // TODO: if there is no source might we still want to
        // bind to sequencer?  ramp, LFO?
        // what about if there are multiple chains declared in
        // a track's setup script?
        if (trackNodes.firstObject) {
          bindSourcenodeToLoopStep(
            trackNodes.firstObject.uniqueSelector,
            onStepCallback,
            this.currentSequence.sequence
          );
        }
      } else {
        console.error('no track nodes to bind to sequencer');
      }
    }

    if (this.isMaster) {
      this.setNodeToVisualize();
    }
  }

  /**
   * find-or-create TrackNode records for each audio node object
   * created on this track
   *
   * this method assumes that cracked audio nodes (which are wrappers around web audio AudioNode objects) were created by the script,
   * and we now need to create or update TrackNode ember data records.
   *
   * TrackNode records are ephemeral, so trackNode.save is never called.
   * TrackControls however, get created on the server, and returned to the client where they are associated with the TrackNode records
   *
   * FIXME: how to re-order if user adds new nodes between existing ones?
   *
   */
  findOrCreateTrackNodeRecords() {
    // trackNode records already created for this track
    let existingTrackNodes = this.trackNodes.sortBy('order');
    // map over audio node objects created in this track's script
    // to find or create corresponding trackNode model records
    this.settingsForNodes.forEach((node, idx) => {
      const [uuid, type] = Object.entries(node)[0];
      if (getCrackedNode(uuid)) {
        // a `ui` attribute might have been defined in the cracked node definition
        const userDefinedInterfaceName = getCrackedNode(uuid).ui;

        // grab the attributes passed in to the initialization of a cracked node that will be used to set default state of track controls (eg. frequency, gain, speed etc.)
        const userSettingsForControl = filterNumericAttrs(node.userSettings);
        let nodesOfThisType = existingTrackNodes.filterBy('nodeType', type);
        //nodes are ordered by index, so take the first one of it's type
        let trackNode = nodesOfThisType.shift();
        let trackNodeAttrs = {
          nodeUUID: uuid, // always update uuid since the audio nodes will be new every time
          nodeType: type,
          order: idx, // FIXME: does this break when nodes changed, reordered, multiple of same type? Consider using a cumulative "createdOrder" (based on initialization from the script, not every rebuild)
          parentMacro: node.parentMacro,
          userDefinedInterfaceName, // get the custom ui saved on the AudioNode, which was defined by the user
        };
        // the parentMacro property is a cracked web audio node which happens to be a macro
        // this is used to determine if the node should appear with the normal node controls,
        // or separated as in the channel strip component.
        // since the AudioNodes are ephemeral, but the TrackNode models persist to the database
        // we need to save a boolean telling the data model that it expects to have a channel strip maco audio node
        trackNodeAttrs.isChannelStripChild =
          trackNodeAttrs.parentMacro &&
          trackNodeAttrs.parentMacro.getType() === 'channelStrip';

        if (trackNode) {
          // then remove it from the possible future choices in existingtrackNodes
          existingTrackNodes = existingTrackNodes.rejectBy(
            'nodeUUID',
            trackNode.nodeUUID
          );
          trackNode.setProperties(trackNodeAttrs);
        } else {
          // ID is necessary for client-side relationships between track-node and track-controller
          // so we're using the audio node's UUID at time of creation.
          // however when a trackNode is found and updated in the if block above,
          // it will update with a new audio node uuid and this id value will be outdated
          // so theyre just a representation of the state of original creation
          trackNodeAttrs = {
            id: `${uuid}`,
            ...trackNodeAttrs,
          };
          trackNode = this.trackNodes.createRecord(trackNodeAttrs);
        }

        // if the `ui` attribute was changed in the script editor, update the interfaceName of track-controls
        trackNode.updateUserDefinedInterfaceName(userDefinedInterfaceName);
        // update track control with user default values
        trackNode.updateDefaultValue(userSettingsForControl);
      }
    });
    return this.trackNodes;
  }

  /**
   * if a node was removed by user, the settingsForNodes array will be without
   * it at this point.
   * so make sure we delete it from the store
   *
   * existingAudioNodes relies on the synchronous point at which this method is called,
   * but since trackNodes might not be fulfilled yet, we need to await it,
   * so it's crucial that existingAudioNodes get declared before awaiting anything
   */
  cleanupNodeRecords() {
    return this.trackNodes.filter((node) => {
      if (!node) {
        return false;
      }
      // FIXME: this only works if there are no duplicates of a given nodeType.
      // this should look at node order as well
      const shouldDestroy =
        !this.settingsForNodes.findBy('nodeType', node.nodeType) &&
        !node.isChannelStripChild; // settingsForNodes does not look at macro child nodes. This should be updated to support other macros too

      if (shouldDestroy) {
        node.deleteRecord();
      }
      return !shouldDestroy;
    });
  }

  /**
   *
   * Loop over trackNode records
   * Search for a matching TrackControl
   *  if found, update it with the trackNode
   *  else create a new TrackControl for the node
   *
   */
  async setupTrackControls(trackNodes) {
    let trackControls = await this.trackControls;
    let nodesWithoutTrackControls = [];
    trackNodes.forEach((trackNode) => {
      // find a matching trackControl
      // FIXME: channelStrip nodes are not successfully matched
      const matchingControls = trackControls.filter(
        (trackControl) =>
          trackNode.nodeType == trackControl.nodeType &&
          trackNode.order == trackControl.nodeOrder
      );
      if (matchingControls.length) {
        matchingControls.forEach((trackControl) => {
          // set the relation on the control to keep ember-data happy
          trackControl.set('trackNode', trackNode);
          // then push the control to the node's relation array
          trackNode?.trackControls.pushObject(trackControl);
          // remove from list after assigning
          trackControls = trackControls.rejectBy('id', trackControl.id);
        });
      } else {
        nodesWithoutTrackControls.push(trackNode);
      }
    });

    // any trackControls that don't match to a node get destroyed
    trackControls.forEach((trackControl) => {
      // except we allow a filepath control to remain even if the node
      // doesn't exist because it ensures that a path value can be provided
      // immediately when a sampler gets created and not need to wait for trackControls
      // to be created
      if (!trackControl.interfaceName === 'filepath') {
        trackControl.destroyRecord();
      }
    });

    nodesWithoutTrackControls.map((trackNode) =>
      trackNode.createTrackControls()
    );
  }

  bindToSequencer(sourceNode) {
    let onStepCallback = this.onStepCallback.bind(this);
    bindSourcenodeToLoopStep(
      sourceNode.uniqueSelector,
      onStepCallback,
      this.currentSequence.sequence
    );
  }

  unbindAndRemoveCrackedNodes() {
    this.sourceNodeRecords.forEach((sourceNode) => {
      unbindFromSequencer(sourceNode.uniqueSelector);
    });
    // FIXME: create a getter on track for this selector
    // with `createdOrder` instead of order
    __(`.track-${this.order}`).remove();
  }

  onStepCallback(index, data, array) {
    if (this.isDeleted) {
      console.warn('tried to run call back on deleted track, must reset loop');
      return;
    }
    this.set('stepIndex', index);

    // before calling the user's onstepScript, pass the current values of all track-controls
    // to the their respective track-nodes. Sampler nodes are a special case, since they get
    // rebuilt on each play, so they need to be passed their params in the .start() call (see below).

    this.trackControls.forEach((trackControl) => {
      // channel strip is a special case so it doesn't get applied on each step
      if (trackControl.get('trackNode.nodeType') == 'channelStrip') {
        return;
      }
      trackControl.setAttrOnTrackStep(index);
    });

    // FIXME: ideally this would not be a proxy, so .content not used
    this.onstepScript.content.invokeFunctionRef(index, data, array);
  }

  get scriptScope() {
    // sampler speed is a special case because they rebuild on every play,
    // so we need to ensure the attrs from the UI controls get applied after .start()
    // this is not an issue for non sampler nodes.
    // If an LFO is modulating the sampler speed, the speed controls will be ignored
    // TODO: It may be possible to multiply the values of the LFO and trackcontrols

    const lfoForSamplerSpeed = this.trackNodes
      .filterBy('nodeType', 'lfo')
      .map((trackNode) => getCrackedNode(trackNode.nodeUUID))
      .find((crackedNode) => crackedNode?.isModulatorType() === 'speed');

    const sourceNodes = this.sourceNodeRecords;
    const adsrNodes = this.adsrNodes;
    const controls = TrackControlModel.serializeForScript(
      this.trackNodes,
      this.stepIndex
    );

    return {
      filepath: this.localFilePath || this.filepathUrl,
      id: this.id,
      trackSelector: `.track-${this.order}`,
      controls: controls, // the value of the controls at this current step
      sliders: this.trackControlData,
      select() {
        let selector = typeof arguments[0] === 'string' ? arguments[0] : null;
        if (selector) {
          return __(`${selector} ${this.trackSelector}`);
        }
        return __(this.trackSelector);
      },
      // These methods may get replaced by the track('selector').play() style of API
      playSourceNodes(attrs) {
        if (sourceNodes) {
          sourceNodes.forEach((sourceNode) => {
            __(sourceNode.uniqueSelector)
              .stop()
              .attr({
                ...controls.findBy('nodeUUID', sourceNode.nodeUUID), //NOTE: explicitly using the key nodeUUID instead of `uuid` because the latter will mess up the native audio node when attrs applied
                ...attrs,
              })
              .start();
          });
        }
      },
      playADSRNodes() {
        adsrNodes.forEach((adsrNode) => {
          __(adsrNode.uniqueSelector).adsr('trigger', 'fast');
        });
      },
      play(attrs) {
        this.playADSRNodes();
        this.playSourceNodes(attrs);
        // TODO: rampNodes, LFONodes
      },
      stop() {
        sourceNodes.forEach((sourceNode) => {
          __(sourceNode.uniqueSelector).stop();
        });
      },
    };
  }
}
