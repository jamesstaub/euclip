import Model, { attr, belongsTo } from '@ember-data/model';
import { isArray } from '@ember/array';
import { timeout, waitForProperty } from 'ember-concurrency';
import { keepLatestTask, task } from "ember-concurrency-decorators";
import { getCrackedNode } from '../utils/cracked';

export default class TrackControlModel extends Model {
  @belongsTo('track') track;
  @belongsTo('trackNode') trackNode;
  
  // while redundant, nodeType and trackNodeOrder are needed here when POSTing 
  // because TrackNode models do not exist in the back end
  @attr('number') nodeOrder;
  @attr('string') nodeType;
  @attr('string') nodeAttr; // the audio attr that will be controlled

  @attr('string') interfaceName; // type of nexus ui element
  @attr('number') min;
  @attr('number') max;
  @attr('number') defaultValue;
  @attr('number') controlValue; // number value of control 
  
  @attr('string') controlStringValue; // value of control for string attributes
  
  @attr() controlArrayValue;

  get controlArrayComputed() {
    // fill the trackControl model's array with defaul value if it is not the correct length
    const sequence = this.get('trackNode.track.currentSequence.sequence');
    const controlArrayValue = this.controlArrayValue || [];
    if (sequence) {
      while (
        controlArrayValue.length < sequence.length
      ) {
        controlArrayValue.push(
          this.defaultValue
        );
      }
      const a = controlArrayValue.slice(0, sequence.length);
      return a;
    } else {
      return null
    }
  }

  set controlArrayComputed(v) {
    // I think this must be defined to prevent an error.
    // TODO use this instead of the on change event for multislider?
    // this.set('controlArrayValue', controlArrayValue)
  }

  get isSlider() {
    return this.interfaceName === 'slider';
  }

  get isMultislider() {
    // hack to prevent bug when a gain node is deleted, channel strip gain inherits it's defaultInterace property
    // see error in audio-models/track cleanupNodeRecords
    if (this.get('trackNode.isChannelStripChild')) {
      return false;
    }
    return this.interfaceName === 'multislider';
  }
  
  
  // TODO these getters could maybe be on a subclass since everything is mostly built for float and float array controls
  // strings are a special case for sampler file paths only
  
  get isFilepath() {
    return this.nodeType === 'sampler' && this.nodeAttr === 'path';
  }

  get pathSegments() {
    if (this.isFilepath && this.controlStringValue) {
      return this.controlStringValue.replace(/%20/g, ' ').split('/');
    }
  }

  get filename() {
    if (this.pathSegments?.length) {
      return this.pathSegments[this.pathSegments.length-1].split('.')[0]
    }
  }

  @belongsTo('track-node') trackNode;
  @belongsTo('track') track;

  attrOnTrackStep(index) {
    if (this.nodeType !== this.trackNode.get('nodeType')) {
      // if this case happens, it is hopefully just because trackControls are in the process of deleting in a non-blocking way,
      //  so we cant wait for the request to finish.
      // in anycase its invalid and should not be used
      return;
    }

    // this might get called by the sequencer while we're trying to delete the node or control
    if (!this.isDestroyed ) {
      if (this.nodeAttr && this.interfaceName === 'multislider') {
        const stepValue = this.controlArrayComputed[index];
        // FIXME: should setAttrs always happen in user's code editor?
        this.setAttrs(stepValue);
        return stepValue;
      } else {
        this.setAttrs(this.controlValue);
        return this.controlValue;
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
      const node = getCrackedNode(uuid);
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

  @task
  *awaitAndDestroy() {
    yield waitForProperty(this, 'isSaving', false)
    if (!this.isDeleted && !this.isDeleting) {
      yield this.destroyRecord();
    }
  }

/**
 * 
 * @param {String} attr
 * @param {String} nodeType 
 * TrackControl default value for each attribute
 */
  static defaultForAttr(attr, nodeType) {
    const paramDefaults = {};
    switch (attr) {
      case 'attack':
        paramDefaults.min = 0.003;
        paramDefaults.max = 1;
        paramDefaults.defaultValue = 6;
        paramDefaults.interfaceName = 'slider';
        break;
      case 'bits':
        paramDefaults.min = 1;
        paramDefaults.max = 16;
        paramDefaults.defaultValue = 6;
        paramDefaults.interfaceName = 'slider';
        break;
      case 'color':
        paramDefaults.min = 0;
        paramDefaults.max = 1000;
        paramDefaults.defaultValue = 800;
        paramDefaults.interfaceName = 'slider';
        break;
      case 'cutoff':
        paramDefaults.min = 0;
        paramDefaults.max = 4000;
        paramDefaults.defaultValue = 1500;
        paramDefaults.interfaceName = 'slider';
        break;
      case 'damping':
        paramDefaults.min = 0;
        paramDefaults.max = 1;
        paramDefaults.defaultValue = 0.84;
        paramDefaults.interfaceName = 'slider';
        break;
      case 'decay':
        paramDefaults.min = 0;
        paramDefaults.max = 4;
        paramDefaults.defaultValue = 0;
        paramDefaults.interfaceName = 'slider';
        break;
      case 'delay':
        paramDefaults.min = 0;
        paramDefaults.max = 6;
        paramDefaults.defaultValue = 2;
        paramDefaults.interfaceName = 'slider';
        break;
      case 'detune':
        paramDefaults.min = 0;
        paramDefaults.max = 100;
        paramDefaults.defaultValue = 0;
        paramDefaults.interfaceName = 'slider';
        break;
      case 'distortion':
        paramDefaults.min = 0;
        paramDefaults.max = 3;
        paramDefaults.defaultValue = 1;
        paramDefaults.interfaceName = 'slider';
        break;
      case 'drive':
        paramDefaults.min = 0;
        paramDefaults.max = 2;
        paramDefaults.defaultValue = .5;
        paramDefaults.interfaceName = 'slider';
        break;
      case 'end':
        paramDefaults.min = 0;
        paramDefaults.max = 1;
        paramDefaults.defaultValue = 1;
        paramDefaults.interfaceName = 'slider';
        break;
      case 'feedback':
        paramDefaults.min = 0;
        paramDefaults.max = 1;
        paramDefaults.defaultValue = 0;
        paramDefaults.interfaceName = 'slider';
        break;
      case 'frequency':
        if (nodeType === 'lfo') {
          paramDefaults.min = 0;
          paramDefaults.max = 20;
          paramDefaults.defaultValue = 5;  
          paramDefaults.interfaceName = 'slider';
        } else {
          paramDefaults.min = 0;
          paramDefaults.max = 10000;
          paramDefaults.defaultValue = 300;
          paramDefaults.interfaceName = 'slider';
        }
        break;
      case 'gain':
        paramDefaults.min = 0;
        paramDefaults.max = 1;
        paramDefaults.defaultValue = .9;
        paramDefaults.interfaceName = 'multislider';
        break;
      case 'knee':
        paramDefaults.min = 0;
        paramDefaults.max = 40;
        paramDefaults.defaultValue = 30;
        paramDefaults.interfaceName = 'slider';
        break;
      case 'pan':
        paramDefaults.min = -1;
        paramDefaults.max = 1;
        paramDefaults.defaultValue = 0;
        paramDefaults.interfaceName = 'slider';
        break;
      case 'postCut':
        paramDefaults.min = 0;
        paramDefaults.max = 5000;
        paramDefaults.defaultValue = 3000;
        paramDefaults.interfaceName = 'slider';
        break;
      case 'q':
        paramDefaults.min = 0;
        paramDefaults.max = 20;
        paramDefaults.defaultValue = 0;
        paramDefaults.interfaceName = 'slider';
        break;
      case 'ratio':
        paramDefaults.min = 1;
        paramDefaults.max = 20;
        paramDefaults.defaultValue = 12;
        paramDefaults.interfaceName = 'slider';
        break;
      case 'release':
        paramDefaults.min = 0;
        paramDefaults.max = 1;
        paramDefaults.defaultValue = .25;
        paramDefaults.interfaceName = 'slider';
        break;
      case 'reverse':
        paramDefaults.min = 0;
        paramDefaults.max = 1;
        paramDefaults.defaultValue = 0;
        paramDefaults.interfaceName = 'toggle';
        break;
      case 'seconds':
        paramDefaults.min = 0;
        paramDefaults.max = 6;
        paramDefaults.defaultValue = 0;
        paramDefaults.interfaceName = 'slider';
        break;
      case 'speed':
        paramDefaults.min = .125;
        paramDefaults.max = 2;
        paramDefaults.defaultValue = 1; 
        paramDefaults.interfaceName = 'multislider';
        break;
      case 'start':
        paramDefaults.min = 0;
        paramDefaults.max = 1;
        paramDefaults.defaultValue = 0;
        paramDefaults.interfaceName = 'slider';
        break;
      case 'threshold':
        paramDefaults.min = -60;
        paramDefaults.max = 0;
        paramDefaults.defaultValue = -12;
        paramDefaults.interfaceName = 'slider';
      case 'path':
        paramDefaults.interfaceName = 'filepath';
        break;
    }
    return paramDefaults;
  }

  /**
   * interfaceNamesForAttr populates the dropdown menu on TrackControls with the allowed interfaceNames
   * which correspond to different TrackControl UI components, depending on what kind of parameter it controls.
   *  
   * TODO finish implementing the contents of interfaceType dropdown for
   * each node attributes's control 
   */
  get interfaceNamesForAttr() {
    const bool = ['toggle']
    const oneD = ['slider', 'dial', 'multislider'];
    const twoD = ['position']; // control 2 attributes
    const tonal = ['piano'];
    const array = ['envelope']
    const filepath = ['filepath'] //
    switch (this.nodeAttr) {
      case 'gain':
        return oneD;
      case 'speed':
        return oneD;
      case 'path':
        return filepath;
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
      case 'knee':
        return oneD;
      case 'start':
        return oneD;
      case 'threshold':
        return oneD;
      case 'end':
        return oneD;
      default:
        return [];
    }
  }
}
