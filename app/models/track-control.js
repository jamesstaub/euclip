import Model from '@ember-data/model';
import DS from 'ember-data';
const { belongsTo, attr } = DS;

export default class TrackControlModel extends Model {
  @attr('string') interfaceName;
  @attr('string') nodeUUID;
  @attr('string') nodeType;
  @attr('number') order;
  @belongsTo('track') track;

  bindTrackEvents(track) {
    track.on('trackStep', (index) => {
      if (this.interfaceName === 'multislider') {
        this.applyAttrsOnStep(index);
      }
    });
  }

  applyAttrsOnStep(index) {
    const attrs = {};
    if (nodeAttr && this.controlDataArray.length) {
      attrs[nodeAttr] = this.controlDataArray[index];
      __._getNode(this.nodeUUID).attr(attrs);
    } else {
      throw ''
    }
  }
}
