import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
import { AudioNodeConfig, defaultParams } from '../utils/audio-node-config';
import { getCrackedNode, noiseNodes, synthNodes } from '../utils/cracked';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import sampsToSecs from '../utils/samps-to-secs';

export const defaultKit = [
  '/Roland/Roland%20CR-8000%20CompuRhythm/CR-8000%20Kit%2001/CR8KBASS.mp3',
  '/Roland/Roland%20CR-8000%20CompuRhythm/CR-8000%20Kit%2001/CRSNARE.mp3',
  '/Roland/Roland%20CR-8000%20CompuRhythm/CR-8000%20Kit%2001/CROHH.mp3',
  '/Roland/Roland%20CR-8000%20CompuRhythm/CR-8000%20Kit%2001/CR8KCLAV.mp3',
  '/Roland/Roland%20CR-8000%20CompuRhythm/CR-8000%20Kit%2001/CRLOWTOM.mp3',
];

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

  /**
   * this attr is used to catch any user-defined UI preferences such as { ui: 'multislider'}
   * exceptions need to be made for attrs such as filepath
   */
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
    // return `${this.nodeType} ${this.track.classSelector}`;
  }

  get isSampler() {
    return this.nodeType === 'sampler';
  }

  get crackedNode() {
    return getCrackedNode(this.nodeUUID);
  }

  get sampleIsLoaded() {
    return this.fileLoadState == FILE_LOAD_STATES.SUCCESS;
  }

  get nativeNode() {
    const [nativeNode] = this.crackedNode.getNativeNode();
    return nativeNode;
  }

  /**
   * Convenience getter to find the TrackControl record for a sampler node's path attribute
   */
  get samplerFilepathControl() {
    return this.trackControls.find((trackControl) => trackControl.isFilepath);
  }

  get oneDimensionalControls() {
    return this.trackControls.filter(
      (trackControl) => !(trackControl.isMultislider || trackControl.isFilepath)
    );
  }

  get multisliderControls() {
    return this.trackControls.filter(
      (trackControl) => trackControl.isMultislider
    );
  }

  static validateControls(trackControls, nodeType) {
    const controlAttrs = Object.keys(AudioNodeConfig[nodeType]?.attrs);
    return controlAttrs.every((controlAttr) =>
      trackControls.find(
        (trackControl) => trackControl.nodeAttr === controlAttr
      )
    );
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
    // set the track control for the `end` controlAttr to the audio buffer's length
    // unless the user has already set a value
    // convert buffer len to seconds
    const trackControls = await this.store.peekAll('track-control');
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
    if (!controlAttrs.map) {
      console.error('Node type not supported');
      return;
    }

    // filepath control gets created with a default value
    //  before the script runs because we want it to be ready to go
    // so it gets special treatment here
    const existingTrackControls = this.track.get('trackControls').toArray();
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

      const params = {
        nodeAttr: controlAttr,
        controlArrayValue: [], // all controls for api must initialize this whenever a multislider is created
        track: this.track,
        trackNode: this,
        nodeType: this.nodeType,
        nodeOrder: this.order,
        interfaceName: interfaceName[0],
        controlValue: defaultValue,
        // set default drum sample before so it's ready synchronously
        controlStringValue:
          interfaceName[0] == 'filepath' &&
          defaultKit[this.track.get('order') % defaultKit.length],
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
      trackControl.save();
      return trackControl;
    });
  }
}
