import Model from '@ember-data/model';
import DS from 'ember-data';
const { attr, belongsTo } = DS;


export default class TrackControlModel extends Model {
  @attr('string') interfaceName; // type of nexus ui element
  @attr('string') nodeAttr; // the audio attr that will be controlled
  @attr('number') min;
  @attr('number') max;
  @attr('number') defaultVal;
  @attr('number') sliderValue; // number value of slider
  @attr() multiSliderData; // array of values
  @belongsTo('track-node') trackNode;

  bindTrackEvents(track) {
    track.on('trackStep', (index) => {
      this.setAttrs(this.sliderValue);
    });
  }

  // applyAttrsOnStep(index) {
  //   if (this.nodeAttr && this.controlDataArray.length) {
  //     this.setAttrs(this.controlDataArray[index]);
  //   } else {
  //     throw 'failed to apply attrs';
  //   }
  // }

  // query and update the audio node object 
  setAttrs(val) {
    const attrs = {};
    attrs[this.nodeAttr] = val;
    __._getNode(this.trackNode.get('nodeUUID')).attr(attrs);
  }

  setValue(value) {
    this.set('sliderValue', value);
    this.setAttrs(value);
  }
}
