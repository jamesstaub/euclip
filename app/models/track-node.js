import Model from '@ember-data/model';
import DS from 'ember-data';
const { belongsTo, hasMany, attr } = DS;

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
   */
  async updateDefaultControlInterface(defaultControlInterface) {
    this.set('defaultControlInterface', defaultControlInterface);
    
    if (this._defaultControlInterface !== this.defaultControlInterface) {
      this.get('trackControls').forEach((trackControl) => {
        trackControl.set('interfaceName', defaultControlInterface);
        trackControl.save();
      });
    }
    this._defaultControlInterface = this.defaultControlInterface;
  }

  // get isChannelStripChild() {   
  //   return this.parentMacro && this.parentMacro.getType() === 'channelStrip';
  // }
}
