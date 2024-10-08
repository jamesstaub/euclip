import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
import { AudioNodeConfig, defaultParams } from '../utils/audio-node-config';
import { getCrackedNode, noiseNodes, synthNodes } from '../utils/cracked';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

import { isPresent } from '@ember/utils';
import FilepathControlModel from './filepath-control';

// TODO deprecate this and use the SoundFile instead
export const FILE_LOAD_STATES = {
  EMPTY: 'empty',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

export default class TrackNodeModel extends Model {
  @service store;
  @belongsTo('track', { async: false, inverse: 'trackNode' }) track;
  @hasMany('track-control', { async: false, inverse: 'trackNode' })
  trackControls;
  @hasMany('filepath-control', { async: false, inverse: 'trackNode' })
  filepathControls;

  @attr('string') userDefinedInterfaceName;
  @attr('string') userSettingsForControl;

  @attr('string') nodeUUID;
  @attr('string') nodeType;
  @attr('number') order;

  @attr() parentMacro; // AudioNode of macro this node belongs to (not serialized)
  @attr('boolean') isChannelStripChild; // flag saved if the parentMacro is set on this node

  @tracked fileLoadState;

  // TODO: if this is a user-defined macro, check that
  // it contains source nodes
  get isSourceNode() {
    return ['buffer', 'sampler', ...synthNodes, ...noiseNodes].includes(
      this.nodeType
    );
  }

  @computed('nodeUUID')
  get uniqueSelector() {
    return `${this.nodeUUID}`;
  }

  get isSampler() {
    return this.nodeType === 'sampler';
  }

  get crackedNode() {
    return getCrackedNode(this.nodeUUID);
  }

  // TODO/INFO rename and clarify this:
  // fileloadstate is a property on the track node that indeicates the buffer was initialized with a file
  // different than state of file downloading
  get sampleIsLoaded() {
    return this.fileLoadState == FILE_LOAD_STATES.SUCCESS;
  }

  get nativeNode() {
    if (!this.crackedNode) return null;
    let nativeNode = this.crackedNode.getNativeNode();

    // will be an array if the cracked node is a macro;
    if (nativeNode instanceof Array) {
      [nativeNode] = nativeNode;
    }
    return nativeNode;
  }

  /**
   * Convenience getter to find the TrackControl record for a sampler node's path attribute
   */
  get samplerFilepathControl() {
    return this.filepathControls.sortBy('nodeOrder')[0];
  }

  get oneDimensionalControls() {
    return this.trackControls.filter(
      (trackControl) => !trackControl.isMultislider
    );
  }

  get multisliderControls() {
    return this.trackControls.filter(
      (trackControl) => trackControl.isMultislider
    );
  }

  get sortedTrackControls() {
    if (!this.trackControls) {
      return [];
    }
    return [...this.trackControls.sortBy('sortOrder')];
  }

  // TODO: simulate throwing an error from the method
  // and try to load a project from the /my-projects route
  // handle error better so it doesnt get stuck
  static validateControls(nodeControlRecords, nodeType) {
    const attrs = AudioNodeConfig[nodeType]?.attrs;

    // no attrs provided
    if (!attrs) return true;
    const controlAttrs = Object.keys(attrs);

    return controlAttrs.every((controlAttr) => {
      if (controlAttr === 'path') {
        return nodeControlRecords.find((nodeControlRecord) => {
          return (
            nodeControlRecord instanceof FilepathControlModel &&
            isPresent(nodeControlRecord.controlValue)
          );
        });
      } else {
        return nodeControlRecords.find(
          (trackControl) => trackControl.nodeAttr === controlAttr
        );
      }
    });
  }

  static channelStripNode(track) {
    // if for some reason there are multiple channelStrips declared, only the first will return
    return track.trackNodes.find(
      (trackNode) => trackNode.nodeType === 'channelStrip'
    );
  }

  /**
   * Cache default interface so a user can use the dropdown menu to change a node's individual controls,
   * without it getting overwritten every time the script get loaded (which happens constantly)
   *
   * FIXME probably still a bug here when you load saved controls from the API
   *
   * Also TODO: this currently sets the same ui attribute to all controls for a node, which might not be desirable.
   * say you wanted to initialize a sampler node with a multislider for the speed param, but a regular slider for start.,
   *
   *  TODO: implement optional parsing of a cracked node's `ui` attribute to recognize a pattern such as
   * ```
   *   {
   *    ui: {
   *        speed: 'multislider',
   *        start: 'number'
   *        end: 'number'
   *       }
   *    }
   * ```
   */
  updateUserDefinedInterfaceName(userDefinedInterfaceName) {
    this.set('userDefinedInterfaceName', userDefinedInterfaceName);
    if (this._userDefinedInterfaceName !== this.userDefinedInterfaceName) {
      this.trackControls.forEach((trackControl) => {
        if (
          trackControl.interfaceNamesForAttr.includes(userDefinedInterfaceName)
        ) {
          trackControl.set('interfaceName', userDefinedInterfaceName);
        } else {
          // some track controls may not support the default defined in a script
          trackControl.set(
            'interfaceName',
            trackControl.interfaceNamesForAttr[0]
          );
        }
        trackControl.save();
      });
    }
    this._userDefinedInterfaceName = this.userDefinedInterfaceName;
  }

  /**
   *
   * @param {object} userSettingsForControl
   * takes an object of userSettings of a cracked node (attributes of the node constructor written by the user)
   *  such as { speed:2 }
   * and updates the trackControl min/max/default values to support that user entered value
   *
   * cache the user default value and only re-set it if the user changed it, this allows user to use the sliders and
   * not have them jump back to the default every time the script re-inits (same problem as updateUserDefinedInterfaceName)
   */
  updateDefaultValue() {
    this.trackControls.forEach((trackControl) => {
      const userDefault = this.userSettingsForControl[trackControl.nodeAttr];
      if (trackControl._defaultValue !== userDefault) {
        trackControl.set('currentUnitTransformIdx', 0); // userDefault attrs entered in the script will always be in the default unit
        trackControl.setValue(userDefault); // make sure to use setValue setter for specific side effects
        trackControl.set('defaultValue', userDefault);
        // setDefault also saves and updates sliders if user hard coded a value into the script
        trackControl.setMinMaxByDefault();
      }
      trackControl.set('_defaultValue', userDefault);
    });
  }

  delinkControlsForDeadNodes() {
    const uuid = this.nodeUUID;
    const node = getCrackedNode(uuid);

    if (uuid && !node) {
      // there's no audio node for this trackNode's uuid, so clear it.
      // this trackControl may then get reassigned to a new or updated trackNode
      console.warn(
        'attempted to updated attrs on an orphaned trackNode',
        this.nodeType
      );
      this.trackControls.forEach((trackControl) => {
        trackControl.nodeUUID = null;
      });
    }
  }

  async setSamplerControlsToBuffer(buffer) {
    // stash the duration here when the buffer is created because the AudioBuffer object
    // gets destroyed after each play and may not always be available when we want it  (eg. for track-control functions)
    // see note about creating an AudioFileModel to separate the TrackNodeModel and downloaded
    this.bufferDuration = buffer.duration;

    // set the track control for the `end` controlAttr to the audio buffer's length
    // unless the user has already set a value
    // convert buffer len to seconds
    const trackControls = await this.store
      .peekAll('track-control')
      .filter((tc) => !tc.isDeleted);

    trackControls
      .filterBy('nodeType', 'sampler')
      .map(
        async (trackControl) =>
          await trackControl.setSamplerControlsToBuffer(buffer)
      );
  }

  /**
   * Create TrackControls for the ephemeral TrackNodes.
   * locally-created records will be available syncronously,
   * and then save to db non-blocking
   *
   *
   */
  findOrCreateTrackControls() {
    // get default attributes for node
    const controlAttrs = Object.keys(AudioNodeConfig[this.nodeType]?.attrs);

    // first handle `path` attr, the only string-valued control
    if (controlAttrs.indexOf('path') > -1) {
      // if it doesn't exist in the store, create and push to track model.
      // doesn't get saved to server until a filepath is actually selected
      FilepathControlModel.findOrCreateWith({
        track: this.track,
        trackNode: this,
      });

      // remove it from the list so the controlAttrs loop is for numeric track controls only
      controlAttrs.splice(controlAttrs.indexOf('path'), 1);
    }

    if (!controlAttrs.map) {
      console.error('Node type not supported');
      return;
    }

    // filepath control gets created with a default value
    //  before the script runs because we want it to be ready to go
    // so it gets special treatment here
    const existingTrackControls = this.track.get('trackControls').toArray();
    // TODO: MOve this to a static method on track control
    // and use audio-param-config instead of `defaultParams`
    return controlAttrs.map((controlAttr) => {
      let defaultForAttr = {};

      defaultForAttr = defaultParams[controlAttr];

      // FIXME: this is an edge case for a poorly designed defaultParams
      if (controlAttr === 'frequency') {
        defaultForAttr = defaultParams[controlAttr][this.nodeType];
      } else {
        defaultForAttr = defaultParams[controlAttr];
      }
      if (!defaultForAttr) {
        console.error('No default params for Node Control: ', controlAttr);
        return null;
      }
      const { min, max, stepSize, defaultValue, interfaceName } =
        defaultForAttr;

      let params = {
        nodeAttr: controlAttr,
        controlArrayValue: [], // all controls for api must initialize this whenever a multislider is created
        track: this.track,
        trackNode: this,
        nodeType: this.nodeType,
        nodeOrder: this.order,
        interfaceName: interfaceName[0],
        controlValue: defaultValue,
        defaultValue,
        min,
        max,
        stepSize,
      };

      let trackControl = existingTrackControls.find((tc) => {
        return (
          !tc.isDeleted &&
          tc.nodeAttr == params.nodeAttr &&
          tc.nodeType == params.nodeType &&
          tc.nodeOrder == params.nodeOrder &&
          tc.interfaceName == params.interfaceName
        );
      });

      if (trackControl) {
        trackControl.setProperties(params);
      } else {
        trackControl = this.store.createRecord('track-control', params);
      }

      if (this.userDefinedInterfaceName) {
        trackControl.set('interfaceName', this.userDefinedInterfaceName);
      }
      // TODO: dont save in the loop
      // implement a batch-save to do it all in one request
      // maybe use the new ember-data Handler/RequestManager system
      trackControl.saveTrackControl.perform();
      return trackControl;
    });
  }
}
