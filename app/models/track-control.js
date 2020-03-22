import Model from '@ember-data/model';
import DS from 'ember-data';
import { isArray } from '@ember/array';
const { attr, belongsTo } = DS;

export default class TrackControlModel extends Model {

  @attr('string') interfaceName; // type of nexus ui element
  @attr('string') nodeAttr; // the audio attr that will be controlled
  @attr('number') min;
  @attr('number') max;
  @attr('number') defaultValue;
  @attr('number') controlValue; // number value of control 
  @attr() controlArrayValue;

  @belongsTo('track-node') trackNode;

  bindTrackEvents(track) {
    track.on('trackStep', (index) => {
      this.setAttrs(this.controlValue);
    });
  }

  applyAttrsOnStep(index) {
    if (this.nodeAttr && this.controlArrayValue.length) {
      this.setAttrs(this.controlArrayValue[index]);
    } else {
      throw 'failed to apply attrs';
    }
  }

  /* 
    Query and update the audio node object immediately
    used for sliders and 1 dimensional values

    multislider value changes on the other hand do not get updated immediately,
    but are accessed by the track model on each step of the sequence
  */
  setAttrs(val) {
    const attrs = {};
    attrs[this.nodeAttr] = val;
    __._getNode(this.trackNode.get('nodeUUID')).attr(attrs);
  }

  setValue(value) {
    if (isArray(value)) {
      this.controlArrayValue = value;
    } else {
      this.set('controlValue', value);
      this.setAttrs(value);
    }
  }
}
