import Model, { attr, belongsTo } from '@ember-data/model';
import { isArray } from '@ember/array';
import {
  timeout,
  waitForProperty,
  keepLatestTask,
  task,
} from 'ember-concurrency';
import { getCrackedNode } from '../utils/cracked';
import { isPresent } from '@ember/utils';
import { defaultKit } from './track-node';

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
      while (controlArrayValue.length < sequence.length) {
        controlArrayValue.push(this.defaultValue);
      }
      const a = controlArrayValue.slice(0, sequence.length);
      return a;
    } else {
      return null;
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

  /**
   * REFACTOR: it may be necessary to decouple the fact that the control uses a multislider interface
   * from the fact that the control is an array type, which means it looks up it's value
   * depending on the current stepIndex of the sequence
   */
  get isMultislider() {
    // hack to prevent bug when a gain node is deleted, channel strip gain inherits it's defaultInterace property
    // see error in audio-models/track cleanupNodeRecords
    if (this.get('trackNode.isChannelStripChild')) {
      return false;
    }
    if (!isPresent(this.controlArrayComputed)) {
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
    return [];
  }

  get filename() {
    if (this.pathSegments?.length) {
      return this.pathSegments[this.pathSegments.length - 1].split('.')[0];
    }
    return '';
  }

  /**
   * Helper for setting a track-control's value on it's respective audio node at
   * a given time,
   */
  attrValueForType(index) {
    if (this.isMultislider) {
      const stepValue = this.controlArrayComputed[index];
      return stepValue;
    } else {
      return this.controlValue;
    }
  }

  setAttrOnTrackStep(index) {
    if (this.nodeType !== this.trackNode.get('nodeType')) {
      // if this case happens, it is hopefully just because trackControls are in the process of deleting in a non-blocking way,
      //  so we cant wait for the request to finish.
      // in anycase its invalid and should not be used
      console.warn('node type mismatch: setAttrOnTrackStep');
      return;
    }

    // this might get called by the sequencer while we're trying to delete the track, track-node or track-control
    if (!this.isDestroyed && this.nodeAttr) {
      if (!this.controlArrayComputed) {
        // TO reproduce
        // create a sine wave track, then duplicate it, change properties
        // then delete the duplicated track
        console.error('FIXME: this should never happen');
      }

      const currentValue = this.attrValueForType(index);
      this.setAttrsOnNode(currentValue);
      return currentValue;
    }
  }

  /* 
    Query and update the audio node object
    used for sliders and 1 dimensional track-control values

    this is fired immediately for sliders
    and triggered on each step for multisliders
  */
  setAttrsOnNode(val) {
    const attrs = {};
    attrs[this.nodeAttr] = val;

    // NOTE:
    // users can (someday) declare a custom selector on a control (like a class)
    // so it can control multiple nodes at once
    // till then this first condition is nevermet
    if (this.trackNode.nodeSelector) {
      __(this.trackNode.nodeSelector).attr(attrs);
    } else {
      const uuid = this.trackNode.get('nodeUUID');
      const node = getCrackedNode(uuid);
      if (node) {
        node.attr(attrs);
      } else if (uuid) {
        // there's no audio node for this trackNode's uuid, so clear it.
        // this trackControl may then get reassigned to a new or updated trackNode
        this.set('nodeUUID', null);
      }
    }
  }

  // TODO create an @unlessDeleted decorator!
  /**
   *
   * @param {*} value
   * Update a TrackControl instance's controlValue or controlArrayValue
   * immediately, depending on the type of object passed in for value
   *
   */
  setValue(value) {
    if (!this.isDestroyed) {
      const uuid = this.trackNode.get('nodeUUID');
      // const node = getCrackedNode(uuid);
      if (isArray(value)) {
        this.set('controlArrayValue', value);
        this.notifyPropertyChange('controlArrayValue');
      } else {
        this.set('controlValue', value);
        this.setAttrsOnNode(value);
      }
      this.saveTrackControl.perform();
    }
  }

  setMinMaxByDefault() {
    if (this.defaultValue > this.max) {
      this.set('max', this.defaultValue);
    }
    if (this.defaultValue < this.min) {
      this.set('min', this.defaultValue);
    }
  }

  /**
   * Every track-control is created with a default value,
   * which can be modified by the user. setDefault applies that value to the track-controls's
   * controlValue and controlArrayValue, and also updates the min, max values to make sure
   * the control's current value is not out of bounds
   */
  setDefault() {
    this.setMinMaxByDefault();
    this.set('controlValue', this.defaultValue);
    this.set(
      'controlArrayValue',
      Array.from(
        new Array(this.controlArrayValue.length),
        () => this.defaultValue
      )
    );

    this.saveTrackControl.perform();
  }

  @keepLatestTask
  *saveTrackControl() {
    // // FIXME: need a better strategy to prevent the last save response from coming in
    // // out of sync with current UI state. (occurs when lots of rapid changes are made to nexus-multislider)
    // See codemirror implementation, needs a modifier class that tracks attr updatate
    yield timeout(5000);
    const project = yield this.track.get('project');
    // dont save if project was deleted during task timeout
    if (project) {
      // this.save not working for saome reason
      yield this.store.saveRecord(this);
    }
  }

  @task
  *awaitAndDestroy() {
    yield waitForProperty(this, 'isSaving', false);
    if (!this.isDeleted && !this.isDeleting) {
      yield this.destroyRecord();
    }
  }

  /**
   *
   * @param {hasMany array} trackNodes
   *
   * create a nested object of track controls for a track's track-node relation.
   * this object is exposed in the Scripts scope as `this.controls` and allows the user
   * to munge the values of track-controls before they get set on the audio nodes
   */

  static serializeForScript(trackNodes, stepIndex) {
    // TODO: add in here a property for the track `scriptScope` to determine
    // the sampler source node since that is a special case
    return trackNodes.map((trackNode) => {
      const attrs = {};
      attrs.nodeUUID = trackNode.nodeUUID;
      trackNode.trackControls.map((trackControl) => {
        (attrs.node = trackNode.nodeType),
          (attrs[trackControl.nodeAttr] =
            trackControl.attrValueForType(stepIndex));
      });
      return attrs;
    });
  }

  /**
   * interfaceNamesForAttr populates the dropdown menu on TrackControls with the allowed interfaceNames
   * which correspond to different TrackControl UI components, depending on what kind of parameter it controls.
   *
   * TODO finish implementing the contents of interfaceType dropdown for
   * each node attributes's control
   */
  get interfaceNamesForAttr() {
    const bool = ['toggle'];
    const oneD = ['slider', 'dial', 'multislider'];
    const twoD = ['position']; // control 2 attributes
    const tonal = ['piano'];
    const array = ['envelope'];
    const filepath = ['filepath']; //
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
        return [...bool, 'multislider'];
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
  static createDefaultFilepathControl(track) {
    const trackControl = track.store.createRecord('track-control', {
      nodeAttr: 'path',
      track: track,
      trackNode: null,
      nodeType: 'sampler',
      nodeOrder: -1,
      interfaceName: 'filepath',
      // set default drum sample before so it's ready synchronously
      controlStringValue: defaultKit[1],
    });
    trackControl.save();
    return trackControl;
  }
}
