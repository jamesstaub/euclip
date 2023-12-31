import Model from '@ember-data/model';
import Evented from '@ember/object/evented';

import ENV from '../config/environment';

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
import TrackNodeModel, { FILE_LOAD_STATES } from '../models/track-node';
import { set } from '@ember/object';
import { isPresent } from '@ember/utils';

export default class TrackAudioModel extends Model.extend(Evented) {
  @service store;
  @tracked nodeToVisualize;
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

  setNodeToVisualize() {
    const firstVisualizableNode = this.settingsForNodes.find(
      (audioNode) => audioNode.nodeType === 'channelStrip'
    );
    const node = __._getNode(firstVisualizableNode?.uuid)?.getNativeNode();
    this.nodeToVisualize = node[0]; // get the gain node of the channelSTrip
  }

  async downloadSample() {
    if (this.filepathUrl) {
      await fetch(this.filepathUrl)
        .then((res) => res.blob()) // Gets the response and returns it as a blob
        .then((blob) => {
          this.localFilePath = URL.createObjectURL(blob);
        })
        .catch((err) => {
          throw err;
        });
    }
  }

  async setupAudioFromScripts(unbindBeforeCreate = true) {
    const initScript = await this.initScript;
    if (!initScript) {
      console.error('no initScript: This happened once, figure out why');
      debugger;
    }
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
        addCustomSelector(node, this.classSelector);
        addCustomSelector(node, `${type} ${this.classSelector}`);
        addCustomSelector(node, node.getUUID()); // NOTE: no . or # is used, the uuid is the full selector
        this.settingsForNodes.push(nodeSettings);
        if (userSettings) {
          // callback is a custom addition to cracked library that
          // fires when audio file loads
          userSettings.callback = async ({ buffer, error }) => {
            const trackNode = this.trackNodes.findBy(
              'nodeUUID',
              node.getUUID()
            );

            if (this.trackNodes && trackNode) {
              if (buffer) {
                trackNode.fileLoadState = FILE_LOAD_STATES.SUCCESS;
                trackNode.setSamplerControlsToBuffer(buffer);
              }
              if (error) {
                console.error('File Load Error:', error);
                trackNode.fileLoadState = FILE_LOAD_STATES.ERROR;
              }
            }
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

    // Destroy all TrackNode records for this track, they'll be recreated from the latest update to the AudioNode tree
    this.trackNodes.forEach((trackNode) => this.store.unloadRecord(trackNode));

    let trackNodes = this.findOrCreateTrackNodeRecords();

    trackNodes = this.applyOrderOfType(trackNodes);

    this.setupTrackControls(trackNodes); // need to wait to make sure we have filepath
    if (this.currentSequence) {
      if (trackNodes.length) {
        let onStepCallback = this.onStepCallback.bind(this);
        // TODO: if there is no source might we still want to
        // bind to sequencer?  ramp, LFO?
        // what about if there are multiple chains declared in
        // a track's setup script?
        if (trackNodes.length) {
          bindSourcenodeToLoopStep(
            this.classSelector,
            onStepCallback,
            this.currentSequence.sequence
          );
        }
      } else {
        console.error('no track nodes to bind to sequencer');
      }
    }
    this.setNodeToVisualize();
  }

  // can take array of trackNodes or trackControls
  // compares keys to determine where in the order of creation
  // this trackNode or trackControl is positioned. used to
  // match existing trackControls to newly re-created trackNodes
  applyOrderOfType(recordsArray) {
    recordsArray.reduce((acc, record) => {
      const { nodeType, nodeAttr } = record;
      let key;
      if (record.constructor.name === 'TrackNodeModel') {
        key = nodeType;
      } else if (record.constructor.name === 'TrackControlModel') {
        key = `${nodeType}-${nodeAttr}`;
      }

      if (isPresent(acc[key])) {
        acc[key] += 1;
      } else {
        acc[key] = 0;
      }
      record.orderOfType = acc[key];
      return acc;
    }, {});
    return recordsArray;
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
    // map over audio node objects created in this track's script
    // to create corresponding trackNode model records
    this.settingsForNodes.forEach((node, idx) => {
      const [uuid, type] = Object.entries(node)[0];
      if (getCrackedNode(uuid)) {
        // a `ui` attribute might have been defined in the cracked node definition
        const userDefinedInterfaceName = getCrackedNode(uuid).ui;

        // grab the attributes passed in to the initialization of a cracked node that will be used to set default state of track controls (eg. frequency, gain, speed etc.)
        const userSettingsForControl = filterNumericAttrs(node.userSettings);
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

        // ID is necessary for client-side relationships between track-node and track-controller
        // so we're using the audio node's UUID at time of creation.
        // however when a trackNode is found and updated in the if block above,
        // it will update with a new audio node uuid and this id value will be outdated
        // so theyre just a representation of the state of original creation
        trackNodeAttrs = {
          id: `${uuid}`,
          ...trackNodeAttrs,
        };

        let trackNode = this.trackNodes.createRecord(trackNodeAttrs);

        // if the `ui` attribute was changed in the script editor, update the interfaceName of track-controls
        trackNode.updateUserDefinedInterfaceName(userDefinedInterfaceName);

        // stash the userSettingsForControl on the trackNode
        // So it can be read by trackControls to set their default values
        // update track control with user default values
        trackNode.userSettingsForControl = userSettingsForControl;
      }
    });
    return this.trackNodes;
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

    trackControls = this.applyOrderOfType(trackControls);

    trackNodes.forEach((trackNode) => {
      const matchingControls = trackControls.filter((trackControl) => {
        return (
          trackNode.nodeType == trackControl.nodeType &&
          trackNode.orderOfType == trackControl.orderOfType
        );
      });

      if (
        TrackNodeModel.validateControls(matchingControls, trackNode.nodeType)
      ) {
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

      trackNode.updateDefaultValue();
    });

    // BUG:
    // Sometimes it seems that specifically the sampler node's track controls get destroyed unwantedly
    // any trackControls that don't match to a node get destroyed
    trackControls.forEach((trackControl) => {
      // except we allow a filepath control to remain even if the node
      // doesn't exist because it ensures that a path value can be provided
      // immediately when a sampler gets created and not need to wait for trackControls
      // to be created
      if (trackControl.interfaceName !== 'filepath') {
        console.log('destroy!', trackControl);
        trackControl.destroyRecord();
      }
    });

    nodesWithoutTrackControls.map((trackNode) =>
      trackNode.findOrCreateTrackControls()
    );
  }

  bindToSequencer() {
    let onStepCallback = this.onStepCallback.bind(this);
    bindSourcenodeToLoopStep(
      this.classSelector,
      onStepCallback,
      this.currentSequence.sequence
    );
  }

  unbindAndRemoveCrackedNodes() {
    this.sourceNodeRecords.forEach((sourceNode) => {
      unbindFromSequencer(sourceNode.uniqueSelector);
    });
    __(`${this.classSelector}`).remove();
  }

  onStepCallback(index, data, array) {
    if (this.isDeleted) {
      console.warn('tried to run call back on deleted track, must reset loop');
      return;
    }

    this.stepIndex = index;

    // before calling the user's onstepScript, pass the current values of all track-controls
    // to the their respective track-nodes. Sampler nodes are a special case, since they get
    // rebuilt on each play, so they need to be passed their params in the .start() call (see below).

    this.trackControls.forEach((trackControl) => {
      // channel strip is a special case so it doesn't get applied on each step
      if (trackControl.get('trackNode.nodeType') == 'channelStrip') {
        return;
      }
      // TODO:
      // look into optimizing this by mapping all the params to an object
      // then updating the nodes once, rather than once per parameter
      trackControl.setAttrOnTrackStep(index);
    });

    this.onstepScript.invokeFunctionRef(index, data, array);
  }

  // TODO: create property "createdOrder" and use that here
  // so weirdness doesnt happen when track order changes
  get classSelector() {
    const indicator = this.isMaster ? 'master' : this.order;
    return `.track-${indicator}`;
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
      trackSelector: this.classSelector,
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
