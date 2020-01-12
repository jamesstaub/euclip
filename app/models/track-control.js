import Model from '@ember-data/model';
import DS from 'ember-data';
const { attr } = DS;

export default class TrackControlModel extends Model {
  @attr('string') interfaceName; // type of nexus ui element
  @attr('string') nodeAttr; // the audio attr that will be controlled

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
