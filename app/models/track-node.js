import Model from '@ember-data/model';
import { attr, belongsTo, hasMany } from '@ember-data/model';

export default class TrackNodeModel extends Model {
  @belongsTo('track') track;
  @hasMany('track-control') trackControls;

  @attr('string') defaultControlInterface;
  @attr('string') nodeUUID;
  @attr('string') nodeType;
  @attr('number') order;

  @attr() parentMacro; // AudioNode of macro this node belongs to (not serialized)
  @attr('boolean') isChannelStripChild; // flag saved if the parentMacro is set on this node

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
   * cache default interface so a user can use the dropdown menu to change a node's individual controls,
   * without it getting overwritten every time the script get loaded (which happens constantly)
   * 
   * FIXME probably still a bug here when you load saved controls from the API
   * 
   *  
   * Also TODO: this currently sets the same ui attribute to all controls for a node, which might not be desirable.
   * say you wanted to initialize a sampler node with a multislider for the speed param, but a regular slider for start.,
   */
  updateDefaultControlInterface(defaultControlInterface) {
    this.set('defaultControlInterface', defaultControlInterface);    
    if (this._defaultControlInterface !== this.defaultControlInterface) {
      this.get('trackControls').forEach((trackControl) => {
        trackControl.set('interfaceName', defaultControlInterface);
        trackControl.save();
      });
    }
    this._defaultControlInterface = this.defaultControlInterface;
  }

  /**
   * 
   * @param {object} userSettingsForControl 
   * takes an object of userSettings of a cracked node (attributes of the node constructor written by the user)
   *  such as { speed:2 }
   * and updates the trackControl min/max/default values to support that user entered value
   * 
   * cache the user default value and only re-set it if the user changed it, this allows user to use the sliders and 
   * not have them jump back to the default every time the script re-inits (same problem as updateDefaultControlInterface)
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
}
