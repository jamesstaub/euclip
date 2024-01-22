import Model, { attr } from '@ember-data/model';
import Evented from '@ember/object/evented';

import ENV from '../config/environment';

import {
  addCustomSelector,
  applyAttrs,
  bindToLoopStep,
  getCrackedNode,
  unbindFromSequencer,
} from '../utils/cracked';
import filterNumericAttrs from '../utils/filter-numeric-attrs';
import { tracked } from '@glimmer/tracking';

import { inject as service } from '@ember/service';
import TrackNodeModel, { FILE_LOAD_STATES } from '../models/track-node';

import { isPresent } from '@ember/utils';
import TrackControlModel from '../models/track-control';
import SoundFileModel from '../models/sound-file';

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
    this.nodeToVisualize = (node && node[0]) || node; // get the gain node of the channelSTrip
  }

  async findOrDownloadSoundFile() {
    // if there is a sound-file record matching this.filePathRelative, use it
    // then make sure its assoicated to this track
    // else create a new sound-file record
    // track nodes will look for a matching sound-file record to associate to

    if (!this.filePathRelative) return;
    await SoundFileModel.findOrDownload(this.filePathRelative, this.store);
  }

  setupAudioFromScripts(unbindBeforeCreate = true) {
    const initScript = this.initScript;
    if (!initScript) {
      console.error('no initScript: This happened once, figure out why');
      debugger;
    }

    // settingsForNodes is an array to store audio node uuids created in this track's script
    // not to be confused with trackNode models,
    // { uuid: type, atts: { filename: '...', speed: 1} }
    this.settingsForNodes = [];

    // cracked.onCreateNode was added to the Cracked library to give access to the AudioNode object upon creation
    // this callback gets called when a user creates cracked audio nodes in the script editor ui
    // macro components should not get individual ui controls
    __.onCreateNode = async (node, type, creationParams, userSettings) => {
      // TODO:
      // if the user creates a sampler with a filepath different than this.filepath
      // then try to dynamically set the filepath track-control to match
      // this will ensure it gets downloaded at the right time

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
          userSettings.callback = ({ buffer, error }) => {
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
                this.initScript.alert = `File Load Error: ${error}`;
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

    this.setupTrackControls(trackNodes);
    if (this.currentSequence) {
      if (trackNodes.length) {
        let onStepCallback = this.onStepCallback.bind(this);
        if (trackNodes.length) {
          bindToLoopStep(
            this.classSelector,
            onStepCallback,
            this.currentSequence.sequence,
            {
              loopIndex:
                this.project.stepIndex % this.currentSequence.sequence.length,
            }
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
  // TODO: refactor to static method?
  applyOrderOfType(recordsArray) {
    recordsArray.reduce((acc, record) => {
      const { nodeType, nodeAttr } = record;
      let key;
      if (record instanceof TrackNodeModel) {
        key = nodeType;
      } else if (record instanceof TrackControlModel) {
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
   
   */
  findOrCreateTrackNodeRecords() {
    // map over audio node objects created in this track's script
    // to create corresponding trackNode model records
    this.settingsForNodes
      .filter((setting) => {
        // currently the channelStrip is the only use case where the child nodes of a macro get TrackNode models.
        if (setting.parentMacro?.nodeType == 'channelStrip') return true;
        return !setting.parentMacro;
      })
      .forEach((node, idx) => {
        const [uuid, type] = Object.entries(node)[0];
        if (getCrackedNode(uuid)) {
          // grab the attributes passed in to the initialization of a cracked node that will be used to set default state of track controls (eg. frequency, gain, speed etc.)
          const userSettingsForControl = filterNumericAttrs(node.userSettings);
          let trackNodeAttrs = {
            nodeUUID: uuid, // always update uuid since the audio nodes will be new every time
            nodeType: type,
            order: idx, // FIXME: does this break when nodes changed, reordered, multiple of same type? Consider using a cumulative "createdOrder" (based on initialization from the script, not every rebuild)
            parentMacro: node.parentMacro,
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
   * Then apply the values from the track controls to the audio nodes
   */
  setupTrackControls(trackNodes) {
    let trackControls = this.trackControls.toArray();
    trackControls = this.applyOrderOfType(this.trackControls);
    let nodesWithoutTrackControls = [];

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

    trackControls.forEach((trackControl) => {
      // except we allow a filepath control to remain even if the node
      // doesn't exist because it ensures that a path value can be provided
      // immediately when a sampler gets created and not need to wait for trackControls
      // to be created
      if (trackControl.interfaceName !== 'filepath') {
        trackControl.destroyRecord();
      }
    });

    nodesWithoutTrackControls.map((trackNode) =>
      trackNode.findOrCreateTrackControls()
    );

    // now apply the value for all track controls old and new
    const attrsForNodes = TrackControlModel.getAttrsForNodes(
      this.trackControls
    );
    this.trackNodes.forEach((trackNode) => {
      trackNode.delinkControlsForDeadNodes();
      const attrs = attrsForNodes[trackNode.uniqueSelector];
      if (attrs) {
        applyAttrs(trackNode.uniqueSelector, attrs);
      }
    });
  }

  bindToSequencer() {
    let onStepCallback = this.onStepCallback.bind(this);

    let loopIndex = this.project.isPlaying
      ? this.project.stepIndex % this.currentSequence.sequence.length
      : 0;

    bindToLoopStep(
      this.classSelector,
      onStepCallback,
      this.currentSequence.sequence,
      {
        loopIndex,
      }
    );
  }

  unbindAndRemoveCrackedNodes() {
    unbindFromSequencer(this.classSelector);
    __(`${this.classSelector}`).remove();
  }

  onStepCallback(index, data, array) {
    if (this.isDeleted) {
      console.warn('tried to run call back on deleted track, must reset loop');

      return;
    }
    this.stepIndex = index;

    if (this.isMaster) {
      this.project.stepIndex = index;
    }

    // before calling the user's onstepScript, pass the current values of all track-controls
    // to the their respective track-nodes. Sampler nodes are a special case, since they get
    // rebuilt on each play, so they need to be passed their params in the .start() call (see below).
    const attrsForNodes = TrackControlModel.getAttrsForNodes(
      this.trackControls,
      index,
      this.currentSequence.sequence
    );

    this.trackNodes.forEach((trackNode) => {
      const attrs = attrsForNodes[trackNode.uniqueSelector];
      if (attrs) {
        applyAttrs(trackNode.uniqueSelector, attrs);
      }
    });
    this.onstepScript.invokeFunctionRef(index, data, array);
  }

  // TODO: create property "trackCreatedOrder" and use that here
  // so weirdness doesnt happen when track order changes
  get classSelector() {
    const indicator = this.isMaster ? 'master' : this.order;
    return `.track-${indicator}`;
  }

  get scriptScope() {
    // sampler speed is a special case because they rebuild on every play,
    // so we need to ensure the attrs from the UI controls get applied after .start()
    // this is not an issue for non sampler nodes.
    const sourceNodes = this.sourceNodeRecords;
    const adsrNodes = this.adsrNodes;
    const controls = TrackControlModel.serializeForScript(
      this.trackNodes,
      this.stepIndex
    );

    return {
      filepath: this.downloadedFilepath,
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
