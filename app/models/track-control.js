import Model from '@ember-data/model';
import DS from 'ember-data';
const { belongsTo, attr } = DS;

export default class TrackControlModel extends Model {
  @belongsTo('track') track;
  @attr('string') interfaceName;
  @attr('string') nodeUUID;
  @attr('string') nodeType;
  @attr('number') order;

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
