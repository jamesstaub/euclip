import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
import { AudioNodeConfig } from '../utils/audio-node-config';
import { noiseNodes, synthNodes } from '../utils/cracked';
import TrackControlModel from './track-control';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
export default class TrackNodeModel extends Model {
  @service store;
  @belongsTo('track') track;
  @hasMany('track-control') trackControls;

  /**
   * this attr is used to catch any user-defined UI preferences such as { ui: 'multislider'}
   * exceptions need to be made for attrs such as filepath
   */
  @attr('string') userDefinedInterfaceName;

  @attr('string') nodeUUID;
  @attr('string') nodeType;
  @attr('number') order;

  @attr() parentMacro; // AudioNode of macro this node belongs to (not serialized)
  @attr('boolean') isChannelStripChild; // flag saved if the parentMacro is set on this node

  // TODO: if this is a user-defined macro, check that
  // it contains source nodes
  get isSourceNode() {
    return ['buffer', 'sampler', ...synthNodes, ...noiseNodes].includes(
      this.nodeType
    );
  }

  @computed('nodeType', 'track.order')
  get uniqueSelector() {
    // FIXME: using `order` for track selectors is super brittle because duplicating + deleting tracks changes the order of others!
    // need an immutable "createdOrder property " to solve this. could be alphabetical to avoid confusion with order
    return `${this.nodeType} .track-${this.get('track.order')}`;
  }

  get isSampler() {
    return this.nodeType === 'sampler';
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

  static validTrackNodes(track) {
    return track.get('trackNodes').filter((trackNode) => {
      // TODO delete trackNodes that have an orphaned uuid
      return trackNode.nodeUUID && __._getNode(trackNode.nodeUUID);
    });
  }

  static channelStripNodes(track) {
    return this.validTrackNodes(track).filter(
      (trackNode) =>
        trackNode.parentMacro &&
        trackNode.parentMacro.getType() === 'channelStrip'
    );
  }

  static channelStripNode(track, type) {
    return this.channelStripNodes(track).find(
      (trackNode) => trackNode.nodeType === type
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
  updateDefaultValue(userSettingsForControl) {
    this.trackControls.forEach((trackControl) => {
      const userDefault = userSettingsForControl[trackControl.nodeAttr];
      if (trackControl._defaultValue !== userDefault) {
        trackControl.set('defaultValue', userDefault);
        trackControl.setDefault(); // setDefault also saves
      }
      trackControl.set('_defaultValue', userDefault);
    });
  }

  /**
   * Create TrackControls for the ephemeral TrackNodes.
   * locally-created records will be available syncronously,
   * and then save to db non-blocking
   *
   */

  createTrackControls() {
    // get default attributes for node
    const controlAttrs = Object.keys(AudioNodeConfig[this.nodeType]?.attrs);
    if (!controlAttrs.map) {
      console.error('Node type not supported');
      return;
    }
    return controlAttrs.map((controlAttr) => {
      // set the defaultValue as the trackControl's value
      const [min, max, defaultValue, interfaceOptions] =
        AudioNodeConfig[this.nodeType].attrs[controlAttr];
      console.log(interfaceOptions[0]);
      const trackControl = this.store.createRecord('track-control', {
        nodeAttr: controlAttr,
        controlArrayValue: [], // all controls for api must initialize this whenever a multislider is created
        track: this.track,
        trackNode: this,
        nodeType: this.nodeType,
        nodeOrder: this.order,
        interfaceName: interfaceOptions[0],
        controlValue: defaultValue,

        // TROUBLESHOOTING: set default here since audio tree isn't awaitint the server response with audio default.
        controlStringValue: interfaceOptions[0] == 'filepath' && "/Roland/Roland%20CR-8000%20CompuRhythm/CR-8000%20Kit%2001/CRSNARE.mp3",
        defaultValue,
        min,
        max,
      });

      if (this.userDefinedInterfaceName) {
        trackControl.set('interfaceName', this.userDefinedInterfaceName);
      }
      if (interfaceOptions[0] == 'filepath') {
        console.log('post-create');
        console.log(trackControl);
        console.log(trackControl.controlStringValue);
      }
      trackControl.save();
      return trackControl;
    });
  }
}
