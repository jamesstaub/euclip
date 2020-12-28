import Model, { attr, belongsTo } from '@ember-data/model';
import { isArray } from '@ember/array';
import { timeout } from 'ember-concurrency';
import { keepLatestTask } from "ember-concurrency-decorators";

export default class TrackControlModel extends Model {
  @belongsTo('track') track;
  @belongsTo('trackNode') trackNode;
  
  // while redundant, nodeType and trackNodeOrder are needed here when POSTing 
  // because TrackNode models do not exist in the back end
  @attr('string') nodeType;
  @attr('number') nodeOrder;
  @attr('string') nodeAttr; // the audio attr that will be controlled

  @attr('string') interfaceName; // type of nexus ui element
  @attr('number') min;
  @attr('number') max;
  @attr('number') defaultValue;
  @attr('number') controlValue; // number value of control 
  @attr() controlArrayValue;

  get controlArrayComputed() {
    // fill the trackControl model's array with defaul value if it is not the correct length
    const sequence = this.get('trackNode.track.sequence');

    const controlArrayValue = this.controlArrayValue || [];
    while (
      controlArrayValue.length < sequence.length
    ) {
      controlArrayValue.push(
        this.defaultValue
      );
    }
    const a = controlArrayValue.slice(0, sequence.length);
    return a;
  }

  set controlArrayComputed(v) {
    // I think this must be defined to prevent an error.
    // TODO use this instead of the on change event for multislider?
    // this.set('controlArrayValue', controlArrayValue)
  }

  get isMultislider() {
    // hack to prevent bug when a gain node is deleted, channel strip gain inherits it's defaultInterace property
    // see error in audio-models/track cleanupNodeRecords
    if (this.get('trackNode.isChannelStripChild')) {
      return false;
    }
    return this.interfaceName === 'multislider';
  }

  @belongsTo('track-node') trackNode;
  @belongsTo('track') track;

  bindTrackEvents(track) {
    // chennelstrip nodes wont ever have onstep events or
    // multisldier controls
    if (!this.get('trackNode.isChannelStripChild')) {
      track.on('trackStep', this.onTrackStep.bind(this));
      this.on('didDelete', ()=>{
        this.off('trackStep', this.onTrackStep.bind(this));
      });
    }
  }


  onTrackStep(index) {
    if (this.nodeType !== this.trackNode.get('nodeType')) {
      throw "Something is wrong: trackControl trackNode mismatch";
    }
    console.log('bind', this.nodeAttr);
    // this might get called by the sequencer while we're trying to delete the node or control    
    if (!this.isDestroyed ) {
      if (this.nodeAttr && this.interfaceName === 'multislider') {
        const stepValue = this.controlArrayComputed[index];
        this.setAttrs(stepValue);
      } else {
        this.setAttrs(this.controlValue);
      }
    }
  }

  /* 
    Query and update the audio node object
    used for sliders and 1 dimensional track-control values

    this is fired immediately for sliders
    and triggered on each step for multisliders
  */
  setAttrs(val) {
    const attrs = {};
    attrs[this.nodeAttr] = val;
    // NOTE:
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
        // there's no audio node for this trackNode's uuid, so clear it.
        // this trackControl may then get reassigned to a new or updated trackNode
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
    const oneD = ['slider', 'multislider'];
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
      case 'detune':
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
      case 'start':
        return oneD;
      case 'end':
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
    
    this.saveTrackControl.perform();
  }

  @keepLatestTask
  *saveTrackControl() {
    // FIXME: need a better strategy to prevent the last save response from coming in 
    // out of sync with current UI state. (occurs when lots of rapid changes are made to nexus-multislider)
    yield timeout(5000);
    // http://ember-concurrency.com/docs/examples/autocomplete/
    yield this.save();
  }
}
