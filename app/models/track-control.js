import Model from '@ember-data/model';
import DS from 'ember-data';
import { isArray } from '@ember/array';

const { attr, belongsTo } = DS;

export default class TrackControlModel extends Model {
  @belongsTo('track') track;
  @belongsTo('trackNode') trackNode;
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
    // I think this must be defined to prevent an error.
    // TODO use this instead of the on change event for multislider?
    // this.set('controlArrayValue', controlArrayValue)
  }

  @belongsTo('track-node') trackNode;
  @belongsTo('track') track;

  bindTrackEvents(track) {
    track.on('trackStep', this.onTrackStep.bind(this));
    this.on('didDelete', ()=>{
      this.off('trackStep', this.onTrackStep.bind(this));
    });
  }


  onTrackStep(index) {
    // this might get called by the sequencer while we're trying to delete the node or control    
    if (!this.isDestroyed ) {
      if (this.nodeAttr && this.interfaceName === 'multislider') {
        this.setAttrs(this.controlArrayValue[index]);
      } else {
        this.setAttrs(this.controlValue);
      }
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
    // users can (someday) declare a custom selector on a control (like a class) 
    // so it can control multiple nodes at once
    // till then this first condition is not met
    if (this.trackNode.nodeSelector) {
      __(this.trackNode.nodeSelector).attr(attrs);
    } else {
      const uuid = this.trackNode.get('nodeUUID');
      const node = __._getNode(uuid);
      if(node) {
        node.attr(attrs);
      } else if (uuid) {
        // there's no audio node for this trackNode's uuid, so clear it
        // maybe should delete, maybe will get reassigned
        this.set('nodeUUID', null);
      }
    }
  }

  // TODO create an @unlessDeleted decorator!
  setValue(value) {
    if (!this.isDestroyed ) {
      if (isArray(value)) {
        this.set('controlArrayValue', value);
        this.notifyPropertyChange('controlArrayValue')
      } else {
        this.set('controlValue', value);
        this.setAttrs(value);
      }
    }
  }


  // TODO finish implementing the contents of interfaceType dropdown for
  // each node attributes's control 
  get uiOptions() {
    const bool = ['toggle']
    const oneD = ['slider', 'multislider', 'number'];
    const twoD = ['position']; // control 2 attributes
    const tonal = ['piano'];
    const array = ['envelope']
    switch (this.nodeAttr) {
      case 'gain':
        return oneD;
      case 'speed':
        return oneD;
      case 'frequency':
        return oneD;
      case 'q':
        return oneD;
      case 'decay':
        return oneD;
      case 'reverse':
        return [...bool , 'multislider'];
      case 'delay':
        return oneD;
      case 'damping':
        return oneD;
      case 'feedback':
        return oneD;
      case 'cutoff':
        return oneD;
      case 'drive':
        return oneD;
      case 'color':
        return oneD;
      case 'postCut':
        return oneD;
      case 'distortion':
        return oneD;
      default:
        return [];
    }
  }

  setDefault() {
    if (this.defaultValue > this.max) {
      this.set('max', this.defaultValue);
    }
    if (this.defaultValue < this.min) {
      this.set('min', this.defaultValue);
    }

    this.set('controlValue', this.defaultValue);
    this.set('controlArrayValue', Array.from(
      new Array(this.controlArrayValue.length
    ), () => this.defaultValue ));
    
      this.get('track').saveTrackControl.perform();
  }
}
