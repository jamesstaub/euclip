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

  get controlArrayComputed() {
    // fill the trackControl model's array with defaul value if it is not the correct length
    const sequence = this.get('trackNode.track.sequence');
    while (
      this.controlArrayValue.length < sequence.length
    ) {
      this.controlArrayValue.push(
        this.defaultValue
      );
    }
    const a = this.controlArrayValue.slice(0, sequence.length);
    return a;
  }

  set controlArrayComputed(v) {
    // TODO use this instead of the on change event for multislider?
    // this.set('controlArrayValue', controlArrayValue)
  }

  @belongsTo('track-node') trackNode;

  bindTrackEvents(track) {
    track.on('trackStep', (index) => {      
      if (this.nodeAttr && this.controlArrayValue.length) {
        this.setAttrs(this.controlArrayValue[index]);
      } else {
        this.setAttrs(this.controlValue);
      }
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
    Query and update the audio node object
    used for sliders and 1 dimensional values

    this is fired immediately for sliders
    and triggered on each step for multisliders
  */
  setAttrs(val) {
    const attrs = {};
    attrs[this.nodeAttr] = val;
    // users can (someday) declare a custom selector on a control
    if (this.trackNode.nodeSelector) {
      __(nodeSelector).attr(attrs);
    } else {         
      __._getNode(this.trackNode.get('nodeUUID')).attr(attrs);
    }
  }

  setValue(value) {
    if (isArray(value)) {
      this.set('controlArrayValue', value);
      this.notifyPropertyChange('controlArrayValue')
    } else {
      this.set('controlValue', value);
      this.setAttrs(value);
    }
  }
}
