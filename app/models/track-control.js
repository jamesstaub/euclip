import Model from '@ember-data/model';
import DS from 'ember-data';
const { belongsTo, attr } = DS;

export default class TrackControlModel extends Model {
  @attr('string') interfaceName;
  @attr('string') nodeUUID;
  @attr('string') nodeType;
  @attr('number') order;
  @belongsTo('track') track;

  async ready() {
    const track = await this.track;
    if (this.type === 'multislider') {
      track.on('trackStep', async (index) => {
        console.log('step',index);
        this.applyAttrsOnStep(index);
      });
    }
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
