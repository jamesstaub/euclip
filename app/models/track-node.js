import Model from '@ember-data/model';
import { attr, belongsTo, hasMany } from '@ember-data/model';
import { paramsForNode } from '../utils/cracked';
import TrackControlModel from './track-control';

export default class TrackNodeModel extends Model {
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

  synthNodes = ['triangle', 'sine', 'square', 'saw'];
  noiseNodes = ['noise', 'pink', 'white', 'brown'];

  // TODO: if this is a user-defined macro, check that 
  // it contains source nodes
  get isSourceNode() {
    return [
    'buffer', 
    'sampler', 
    ...this.synthNodes,
    ...this.noiseNodes,
    ].includes(this.nodeType);
  }


  /**
   * Convenience getter to find the TrackControl record for a sampler node's path attribute
   */
  get samplerFilepathControl() {
    return this.trackControls.find((trackControl) => trackControl.isFilepath);
  }

  get oneDimensionalControls() {
    return this.trackControls.filter((trackControl) => !(trackControl.isMultislider || trackControl.isFilepath));
  }

  get multisliderControls() {
    return this.trackControls.filter((trackControl) => trackControl.isMultislider);
  }

  static validTrackNodes(track) {
    return track.get('trackNodes').filter((trackNode) => {
      // TODO delete trackNodes that have an orphaned uuid
      return trackNode.nodeUUID && __._getNode(trackNode.nodeUUID);
    });
  }

  static channelStripNodes(track) {
    return this.validTrackNodes(track)
      .filter((trackNode) => trackNode.parentMacro && trackNode.parentMacro.getType() === 'channelStrip');
  }

  static channelStripNode(track, type) {
    return this.channelStripNodes(track)
      .find((trackNode)=> trackNode.nodeType === type);
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
      this.get('trackControls').forEach((trackControl) => {
        if (trackControl.interfaceNamesForAttr.includes(userDefinedInterfaceName)) {
          trackControl.set('interfaceName', userDefinedInterfaceName);
        } else {
          // some track controls may not support the default defined in a script
          trackControl.set('interfaceName', trackControl.interfaceNamesForAttr[0]);
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
    this.get('trackControls').forEach((trackControl) => {
      const userDefault = userSettingsForControl[trackControl.nodeAttr]
      if (trackControl._defaultValue !== userDefault) {
        trackControl.set('defaultValue', userDefault);
        trackControl.setDefault()
        trackControl.save();
      }
      trackControl.set('_defaultValue', userDefault);
    });
  }
  

  /**
   * Create TrackControls for the ephemeral TrackNodes
   * locally-created records will be available syncronously,
   * and then save to db non-blocking
   * 
   */
  createTrackControls() {
    const controlAttrs = paramsForNode(this.nodeType);
    return controlAttrs.map((controlAttr) => {
      const defaults = TrackControlModel.defaultForAttr(controlAttr, this.nodeType);
      
      // set the defaultValue as the trackControl's value
      defaults.controlValue = defaults.defaultValue;

      const trackControl  = this.store.createRecord('track-control', {
        nodeAttr: controlAttr,
        controlArrayValue: [], // all controls for api must initialize this whenever a multislider is created
        track: this.track,
        trackNode: this,
        nodeType: this.nodeType,
        nodeOrder: this.order, 
        ...defaults,
      });
      
      if (this.userDefinedInterfaceName) {
        trackControl.set('interfaceName', this.userDefinedInterfaceName)
      }
      
      trackControl.save();
      return trackControl;
    });
  }
}
