import Model, { attr, belongsTo } from '@ember-data/model';
import { isArray } from '@ember/array';
import {
  timeout,
  waitForProperty,
  keepLatestTask,
  task,
  restartableTask,
} from 'ember-concurrency';

import { isPresent } from '@ember/utils';

import { setProperties } from '@ember/object';

import {
  defaultNodeParamsByUnit,
  unitOptionsForNode,
} from '../utils/audio-param-config';
import { applyAttrs } from '../utils/cracked';

function findSmallestDivisor(value, stepSize, range) {
  let minDifference = Math.abs(value - Math.round(value / stepSize) * stepSize);
  let smallestDivisor = stepSize;

  for (let divisor = 1; divisor <= range; divisor++) {
    if (range % divisor === 0) {
      const nearestMultiple = Math.round(value / divisor) * divisor;
      const difference = Math.abs(value - nearestMultiple);

      if (difference < minDifference) {
        minDifference = difference;
        smallestDivisor = divisor;
      }
    }
  }

  return smallestDivisor;
}

function findSmallestDecimalPlace(value) {
  const stringValue = value.toString();
  const decimalIndex = stringValue.indexOf('.');
  return decimalIndex === -1
    ? 1
    : Math.pow(10, -(stringValue.length - decimalIndex - 1));
}

// TODO refactor into subclasses for diferent types
// move configurations into the model
// add param-specific validations like time bounding start/end params on sample
export default class TrackControlModel extends Model {
  @belongsTo('track', { async: false, inverse: 'trackControls' }) track;
  @belongsTo('trackNode', { async: false, inverse: 'trackControls' }) trackNode;

  // while redundant, nodeType and trackNodeOrder are needed here when POSTing
  // because TrackNode models do not exist in the back end
  @attr('number') nodeOrder;
  @attr('string') nodeType;
  @attr('string') nodeAttr; // the audio attr that will be controlled

  @attr('string') interfaceName; // type of nexus ui element
  @attr('number', { defaultValue: 0 }) currentUnitTransformIdx; // index of the unit transform function applied to this control (see audio-param-config.js)
  @attr('number') min;
  @attr('number') max;
  @attr('number') stepSize;
  @attr('number') defaultValue;
  @attr('number') controlValue; // number value of control
  @attr('boolean') applyHitsOnly; // TODO: move to a MultisliderControl subclass

  // TODO: move this to a subclass for FilepathControl
  @attr('string')
  controlStringValue; // value of control for string attributes

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

  get isToggle() {
    return this.interfaceName === 'toggle';
  }

  /**
   * REFACTOR: it may be necessary to decouple the fact that the control uses a multislider interface
   * from the fact that the control is an array type, which means it looks up it's value
   * depending on the current stepIndex of the sequence
   */
  get isMultislider() {
    // hack to prevent bug when a gain node is deleted, channel strip gain inherits it's defaultInterface property
    // see error in audio-models/track cleanupNodeRecords
    if (this.trackNode.isChannelStripChild) {
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

  // Ordered array if unit names for this control
  // the 0th element is the default unit that the node expects
  get paramUnitNames() {
    if (!unitOptionsForNode[this.nodeAttr]) {
      debugger;
    }
    return unitOptionsForNode[this.nodeAttr];
  }

  get currentParamUnitLabel() {
    return this.paramUnitNames[this.currentUnitTransformIdx];
  }

  get unitParamsForAttr() {
    return defaultNodeParamsByUnit[this.nodeType][this.nodeAttr];
  }

  get sortOrder() {
    // add more track control attrs here as needed for
    // more intuitive sort order
    switch (this.nodeAttr) {
      case 'speed':
        return 0;
      case 'start':
        return 1;
      case 'end':
        return 2;
      case 'loop':
        return 3;
      default:
        return this.nodeAttr;
    }
  }

  transformCurrentUnit(value) {
    if (!this.unitParamsForAttr) {
      console.warn(
        'Did not find track control config for ',
        this.nodeType,
        this.nodeAttr
      );
      return value;
    }

    const paramsForUnit = this.unitParamsForAttr[this.currentParamUnitLabel];

    if (!paramsForUnit?.func) {
      return value;
    }

    const sampleLenSec = this.trackNode.bufferDuration || 0;

    const ret = paramsForUnit.func(value, {
      intervalMs: this.track.project.loopInterval,
      sampleLenSec: sampleLenSec,
      seqSteps: this.track.currentSequence?.steps || 1,
    });

    if (isFinite(ret)) {
      return ret;
    } else {
      console.error(`ERROR: passed a ${ret} attribute from track control`);
    }
  }

  /**
   * Helper the track-control's usable value at a given time  */
  attrValueForType(index) {
    if (this.isMultislider) {
      const stepValue = this.controlArrayComputed[index];
      if (!isNaN(stepValue)) return this.transformCurrentUnit(stepValue);
    } else {
      if (this.controlStringValue) {
        return this.controlStringValue;
      }
      if (!isNaN(this.controlValue)) {
        return this.transformCurrentUnit(this.controlValue);
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
      if (isArray(value)) {
        this.controlArrayValue = value;
      } else {
        if (this.controlValue === value) {
          return;
        }

        this.beforeUpdateValue(value);
        this.controlValue = value;
        const attrs = {};
        attrs[this.nodeAttr] = value;
        applyAttrs(this.trackNode.uniqueSelector, attrs);
      }
      this.saveTrackControl.perform();
    }
  }

  // TODO:
  // this currently overwrites user-defined start and end values.
  // custom UI elements for start and end could be created to just disallow
  // customization. till then it will seem buggy
  // Move this to
  setSamplerControlsToBuffer(nativeBuffer) {
    // unit transforms will handle their own min/max/defaults
    // so only set them below if it's the default unit in seconds
    if (this.currentUnitTransformIdx > 0) return;

    // set the track control for the `end` controlAttr to the audio buffer's length
    // unless the user has already set a value
    // convert buffer len to seconds
    const bufferLen = nativeBuffer.duration;
    if (this.nodeAttr === 'start') {
      setProperties(this, {
        min: 0,
        max: bufferLen,
        defaultValue: 0,
      });
    }
    if (this.nodeAttr === 'end') {
      setProperties(this, {
        min: 0,
        max: bufferLen,
        defaultValue: bufferLen,
      });
    }
  }

  // compares value to min, max, stepSize of trackControl record.
  // if value is not a number, or is outside of min/max, or is not a multiple of stepSize,
  // then update those values on the trackControl accordingly (and save)
  beforeUpdateValue(value) {
    if (cracked.isUndef(value)) {
      console.warn('WARNING: track control value is undefined', this);
      return;
    }
    const min = this.min;
    const max = this.max;
    const isNumber = !isNaN(value);

    if (isNumber) {
      this.set('min', Math.min(min, value));
      this.set('max', Math.max(max, value));
    }

    // if the value is not evenly divisible by the step size, update the step size
    // so the new value can be set exactly
    // make sure it works for floats and ints

    const isMultipleOfStepSize = Number.isInteger(value / this.stepSize);

    if (!isMultipleOfStepSize && this.stepSize !== 0) {
      const range = Math.abs(max - min);

      // Find the smallest divisor that minimizes the difference
      const divisorForIntegers = findSmallestDivisor(
        value,
        this.stepSize,
        range
      );

      // Find the smallest decimal place for floats
      const divisorForDecimals = findSmallestDecimalPlace(value);

      // Ensure the step size is a positive value and choose the smaller divisor
      const newStepSize = Math.max(
        0.0001,
        Math.min(divisorForIntegers, divisorForDecimals)
      );

      this.set('stepSize', newStepSize);
    }
  }

  // force the min/max/stepSize to make sure the defaultValue
  // is within their range.
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
    this.setValue(this.defaultValue);
    this.set(
      'controlArrayValue',
      Array.from(
        new Array(this.controlArrayValue.length),
        () => this.defaultValue
      )
    );

    this.saveTrackControl.perform();
  }

  // TODO: this should also get called on record creation
  // and replace existing defaultParam config
  setParamUnit({ index, value }) {
    if (this.currentUnitTransformIdx === index) return;

    this.currentUnitTransformIdx = index;

    const { min, max, stepSize, defaultValue } =
      this.unitParamsForAttr[this.currentParamUnitLabel];

    if (isPresent(min)) {
      this.min = min;
    }

    if (isPresent(max)) {
      this.max = max;
    }

    if (isPresent(stepSize)) {
      this.stepSize = stepSize;
    }

    if (isPresent(defaultValue)) {
      this.defaultValue = defaultValue;
      this.controlValue = defaultValue;
    }

    // TODO:
    // when changing units, attempt to set the current controlValue intelligently
    // depending on which unit we're going to from.
    // if we're going from index non-0 to 0
    this.saveTrackControl.perform();
  }

  @restartableTask
  *saveTrackControl() {
    const project = this.track.get('project');
    // dont save if project was deleted during task timeout
    if (project) {
      yield timeout(1000);
      yield this.store.saveRecord(this);
    } else {
      console.error('Tried to save track control with missing project');
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

  // FIXME:
  // decouple script scopes for init and onstep scripts because
  // the use of attrValuesForType will potentially try to use the sampleLen unit param to get
  // the control value before the trackNode.crackedNode exists, causing it to fail.
  static serializeForScript(trackNodes, stepIndex) {
    // TODO: add in here a property for the track `scriptScope` to determine
    // the sampler source node since that is a special case
    return trackNodes.map((trackNode) => {
      const attrs = {};
      attrs.nodeUUID = trackNode.nodeUUID;

      trackNode.trackControls.map((trackControl) => {
        attrs.node = trackNode.nodeType;
        attrs[trackControl.nodeAttr] = trackControl.attrValueForType(stepIndex);
      });
      return attrs;
    });
  }

  // Loop over a list of trackControls an return an array of
  // attr objects for each trackNode.

  static getAttrsForNodes(trackControls, index, sequence) {
    return trackControls
      .filter((trackControl) => {
        // TODO: if trackControl.disabled skip
        // FIXME: abandonned trackControls should be destroyed by now
        if (!trackControl.trackNode) {
          return false;
        }

        if (trackControl.get('trackNode.nodeType') == 'channelStrip') {
          return false;
        }

        if (trackControl.nodeType !== trackControl.trackNode.nodeType) {
          // if this case happens, it is hopefully just because trackControls are in the process of deleting in a non-blocking way,
          //  so we cant wait for the request to finish.
          // in anycase its invalid and should not be used
          // it could also be a default filepath control on a track with no sampler node
          return false;
        }

        // if the trackControl is a multislider, and this update is called
        // from the onstepcallback, only apply the value if the stepIndex has a value
        if (sequence && trackControl.isMultislider && sequence[index] == 0) {
          // FIXME, thios seems to cause a bug and not work in
          return !trackControl.applyHitsOnly;
        }

        return true;
      })
      .reduce((acc, trackControl) => {
        // this might get called by the sequencer while we're trying to delete the track, track-node or track-control
        if (!trackControl.isDestroyed && trackControl.nodeAttr) {
          if (!trackControl.controlArrayComputed) {
            // TO reproduce
            // create a sine wave track, then duplicate it, change properties
            // then delete the duplicated track
            console.error('FIXME: this should never happen');
          }

          if (!acc[trackControl.trackNode.uniqueSelector]) {
            acc[trackControl.trackNode.uniqueSelector] = {};
          }

          acc[trackControl.trackNode.uniqueSelector][trackControl.nodeAttr] =
            trackControl.attrValueForType(index);
          return acc;
        }
      }, {});
  }

  get defaultInterfaceName() {
    if (this.nodeAttr === 'path') return 'filepath';
    return 'slider';
  }

  static async createDefaultFilepathControl(track) {
    const trackControl = track.store.createRecord('track-control', {
      nodeAttr: 'path',
      track: track,
      trackNode: null,
      nodeType: 'sampler',
      nodeOrder: -1,
      interfaceName: 'filepath',
    });
    await trackControl.saveTrackControl.perform();
    return trackControl;
  }
}
