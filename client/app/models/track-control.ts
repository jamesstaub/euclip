import waitUntil from 'euclip/utils/wait-until';
import Model, { attr, belongsTo } from '@ember-data/model';
import { isArray } from '@ember/array';
import { timeout, task, restartableTask } from 'ember-concurrency';

import { isPresent } from '@ember/utils';
import { setProperties } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { fromNormalized, toNormalized, type ParamScale } from '../utils/param-scale';

import {
  defaultNodeParamsByUnit,
  macroUnitParams,
  unitOptionsFor,
} from '../utils/audio-param-config';
import { resolveSpec } from '../utils/macros/schema';
import { applyNodeAttrs } from '../utils/cracked';
import type TrackModel from './track';
import type TrackNodeModel from './track-node';

// a sample longer than this defaults to Loop Sync speed
const LOOP_SYNC_MIN_SECONDS = 2;

// node ids that already shadowed an Array method on `this.controls` (warned about once)
const warnedIds = new Set<string>();

// TODO refactor into subclasses for diferent types
// move configurations into the model
// add param-specific validations like time bounding start/end params on sample
export default class TrackControlModel extends Model {
  // @belongsTo('track', { async: false, inverse: 'trackControls' }) track;
  // @belongsTo('track-node', { async: false, inverse: 'trackControls' })
  // trackNode;

  
  // @attr('number') nodeOrder;
  // @attr('string') nodeType;
  // @attr('string') nodeAttr; 

  // @attr('string') interfaceName; // type of nexus ui element
  // @attr('number', { defaultValue: 0 }) currentUnitTransformIdx; 
  // @attr('number') min;
  // @attr('number') max;
  // @attr('number') stepSize;
  // @attr('number') defaultValue;
  // @attr('number') controlValue; // number value of control
  // @attr('boolean') applyHitsOnly; 

  // @attr() controlArrayValue;

  @belongsTo('track', { async: false, inverse: 'trackControls' }) declare track: TrackModel;
  @belongsTo('track-node', { async: false, inverse: 'trackControls' }) declare trackNode: TrackNodeModel;

  // // while redundant to trackNode model, nodeType and trackNodeOrder are needed here when POSTing
  // // because TrackNode models do not exist in the back end
  @attr('number') declare nodeOrder: number;
  @attr('string') declare nodeType: string;
  @attr('string') declare nodeAttr: string; // the audio attr that will be controlled

  @attr('string') declare interfaceName: string;
  @attr('number', { defaultValue: 0 }) declare currentUnitTransformIdx: number; // index of the unit transform function applied to this control (see audio-param-config.js)
  @attr('number') declare min: number;
  @attr('number') declare max: number;
  @attr('number') declare stepSize: number;
  // Value layers, lowest to highest priority:
  //   defaultValue  the base the control resets to (starts as the init script's literal, or the param spec's default)
  //   controlValue  the user's setting (slider, piano, ...); equals defaultValue until the user changes it
  //   modulation    a one-step value written by the onstep script; never saved (see `modulate`)
  @attr('number') declare defaultValue: number;
  @attr('number') declare controlValue: number;
  // The init script's literal for this attr, in the node's native units. Compared against the script on
  // every rebuild so only an *edit to the script* resets the control (not user changes or unit switches).
  @attr('number') declare scriptValue: number | null;
  @tracked modulation: number | undefined = undefined;
  @attr('boolean') declare applyHitsOnly: boolean; // TODO: move to a MultisliderControl subclass
  // One value per sequence step, for controls in multislider mode. Must be an attr: without it
  // Ember Data never sends it to the API and edits are lost on reload.
  @attr() declare controlArrayValue: number[] | null;
  // which of the track's sequences this control's steps follow (see `sequence`)
  @attr('number', { defaultValue: 0 }) declare sequenceOrder: number;

  /**
   * The sequence record this control follows: the track's sequence whose `order` matches
   * `sequenceOrder`, falling back to the primary one (e.g. if that sequence was deleted).
   */
  get sequenceRecord() {
    const track = this.track ?? this.trackNode?.track;
    const sequences = track?.sortedSequences ?? [];
    return sequences.find((s) => s.order === this.sequenceOrder) ?? sequences[0];
  }

  get controlArrayComputed() {
    // fill the trackControl model's array with defaul value if it is not the correct length
    const sequence = this.sequenceRecord?.sequence;
    const stored = this.controlArrayValue || [];
    if (sequence) {
      // pad with the default (never mutate the stored attr in place) and trim to the sequence length
      const padded = stored.slice(0, sequence.length);
      while (padded.length < sequence.length) {
        padded.push(this.defaultValue);
      }
      return padded;
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

  // a choice setting (e.g. a macro's waveform): the control value is an index into `choices`
  get isSelect() {
    return this.interfaceName === 'select';
  }

  get macroSpec() {
    return this.trackNode?.macroSchema?.[this.nodeAttr];
  }

  get choices(): string[] {
    return this.macroSpec?.choices ?? [];
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

  // Ordered array if unit names for this control
  // the 0th element is the default unit that the node expects
  get paramUnitNames() {
    const spec = this.macroSpec;
    return spec ? [resolveSpec(spec).unit] : unitOptionsFor(this.nodeType, this.nodeAttr);
  }

  get currentParamUnitLabel() {
    return this.paramUnitNames[this.currentUnitTransformIdx];
  }

  get unitParamsForAttr() {
    const spec = this.macroSpec;
    return spec ? macroUnitParams(spec) : defaultNodeParamsByUnit[this.nodeType]?.[this.nodeAttr];
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

    // Loop Sync stretches the sample to the loop, so it needs the sample's length. Until a file is chosen
    // and decoded there is nothing to stretch: play at normal speed (silently; this runs on every step).
    if (this.currentParamUnitLabel === 'Loop Sync' && !sampleLenSec) {
      return 1;
    }

    const ret = paramsForUnit.func(value, {
      intervalMs: this.track.project.loopInterval,
      sampleLenSec: sampleLenSec,
      seqSteps: this.track.currentSequence?.length || 1,
      sliceBoundaries: this.trackNode.sliceBoundaries,
    });

    if (typeof ret === 'string' || isFinite(ret)) {
      return ret;
    } else {
      console.error(`ERROR: passed a ${ret} attribute from track control`);
    }
  }

  /**
   * Helper the track-control's usable value at a given time  */
  attrValueForType(index) {
    // an on/off is 0 or 1 whatever is stored (per-step values saved before they snapped can be fractions)
    const binary = (value) => (this.isBinary && Number.isFinite(value) ? (value >= 0.5 ? 1 : 0) : value);

    if (this.isMultislider) {
      const stepValue = this.controlArrayComputed[index];
      if (!isNaN(stepValue)) return binary(this.transformCurrentUnit(stepValue));
    } else {
      if (!isNaN(this.controlValue)) {
        return binary(this.transformCurrentUnit(this.controlValue));
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
    if (this.isDestroyed) return;

    if (isArray(value)) {
      this.controlArrayValue = value;
    } else {
      if (this.controlValue === value) {
        return;
      }
      this.controlValue = value;
      this.clearModulation(); // the user took over, so the script's step offset no longer applies
      this.applyToAudio();
    }
    this.saveTrackControl.perform();
  }

  /**
   * Write this control's current value to its audio node, through the unit transform
   * (the audio node expects native units, e.g. Hz, not the Half Steps the slider shows).
   */
  applyToAudio(index?: number) {
    const value = this.attrValueForType(index);
    const selector = this.trackNode?.uniqueSelector;
    if (value === undefined || !selector || !this.nodeAttr) return;
    this.applyAttrsToNode({ [this.nodeAttr]: value });
  }

  // Everything that reaches the audio goes through the node first (see TrackNode#toAudioAttrs): euclip-only
  // settings are dropped.
  private applyAttrsToNode(attrs: Record<string, any>) {
    const node = this.trackNode;
    if (!node?.uniqueSelector) return;
    let audioAttrs = node.nodeType === 'sampler' ? node.toAudioAttrs(attrs) : attrs;
    if (Object.keys(audioAttrs).length) applyNodeAttrs(node.uniqueSelector, node.nodeType, audioAttrs);
  }

  /** True once the user has moved the control away from its base value. */
  get isOverridden(): boolean {
    if (this.isMultislider) return false;
    return Number.isFinite(this.controlValue) && this.controlValue !== this.defaultValue;
  }

  // The unit transform of the current unit, or undefined if none/unknown
  get currentUnitParams() {
    return this.unitParamsForAttr?.[this.currentParamUnitLabel];
  }

  get scale(): ParamScale {
    // a macro setting can declare its scale in the script; otherwise it comes from the unit
    const scale = this.macroSpec?.scale ?? this.currentUnitParams?.scale;
    return scale === 'log' ? 'log' : 'linear';
  }

  get normalized(): number {
    return toNormalized(this.controlValue, { min: this.min, max: this.max, scale: this.scale });
  }

  setNormalized(norm: number) {
    this.setValue(fromNormalized(norm, { min: this.min, max: this.max, scale: this.scale }));
  }

  /**
   * Called when the init script's literal for this attr is different from last time (or new):
   * the script is the source of truth again, so the control starts over from it.
   */
  adoptScriptValue(literal: number) {
    this.scriptValue = literal;
    this.currentUnitTransformIdx = 0; // scripts speak the node's native unit, which is unit 0
    this.defaultValue = literal;
    this.controlValue = literal;
    this.setMinMaxByDefault();
    this.applyToAudio();
    this.saveTrackControl.perform();
  }

  /** Back to the base value (the script's literal unless the user changed the default). */
  resetToDefault() {
    this.setValue(this.defaultValue);
    this.saveTrackControl.perform();
  }

  /**
   * Set by the onstep script for the current step only (`this.controls.lead.frequency = x`).
   * `value` is in native units. It goes straight to the audio node and is cleared at the start of the
   * next step, so a script can read the slider and offset it every step without compounding.
   */
  modulate(value: number) {
    if (!Number.isFinite(value)) {
      console.warn(`Ignored non-numeric value for ${this.nodeType}.${this.nodeAttr}:`, value);
      return;
    }
    this.modulation = value;
    this.applyAttrsToNode({ [this.nodeAttr]: value });
  }

  clearModulation() {
    if (this.modulation !== undefined) this.modulation = undefined;
  }

  /** What the audio node actually gets: this step's modulation if there is one, else the slider's value. */
  effectiveValue(index?: number) {
    return this.modulation ?? this.attrValueForType(index);
  }

  /**
   * The modulation expressed in the slider's units, for drawing a marker. Unit transforms only go one
   * way (UI -> native), so this is only available for units that are the identity (Hz, seconds, ...).
   */
  get modulatedUiValue(): number | undefined {
    if (this.modulation === undefined) return undefined;
    const func = this.currentUnitParams?.func;
    if (!func) return this.modulation;
    try {
      const ctx = { intervalMs: 500, sampleLenSec: 1, seqSteps: 1 };
      return func(1, ctx) === 1 && func(2, ctx) === 2 ? this.modulation : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Called when a sampler's file has loaded. Sizes `start`/`end` to the sample and, for a long sample,
   * switches `speed` to Loop Sync. Anything the user or the script set is kept (only clamped to fit).
   */
  setSamplerControlsToBuffer(nativeBuffer: AudioBuffer) {
    if (this.nodeType !== 'sampler') return;
    const length = nativeBuffer.duration;

    if (this.nodeAttr === 'speed') {
      this.chooseSpeedUnitForLength(length);
      return;
    }
    if (this.nodeAttr !== 'start' && this.nodeAttr !== 'end') return;

    // other units (ms, % of sample, loop steps) have ranges that don't depend on the sample
    if (this.currentUnitTransformIdx > 0) return;

    const untouched = !this.isOverridden && this.scriptValue == null;
    const clamp = (n: number) => Math.min(Math.max(n, 0), length);
    this.min = 0;
    this.max = length;
    if (untouched) {
      // never customised: start at the start of the sample, end at its end
      const base = this.nodeAttr === 'end' ? length : 0;
      this.defaultValue = base;
      this.controlValue = base;
    } else {
      this.defaultValue = clamp(this.defaultValue);
      this.controlValue = clamp(this.controlValue);
    }
    this.applyToAudio();
    this.saveTrackControl.perform();
  }

  /**
   * A sample longer than 2 seconds is rarely played at its natural speed: it is used as a loop that
   * should fit the sequence, which is what Loop Sync speed does. Only an untouched speed control
   * switches (and then no longer qualifies), so a unit the user picked is never changed behind their back.
   */
  chooseSpeedUnitForLength(length: number) {
    const untouched =
      this.currentUnitTransformIdx === 0 && !this.isOverridden && this.scriptValue == null;
    if (!(length > LOOP_SYNC_MIN_SECONDS) || !untouched) return;
    const index = this.paramUnitNames.indexOf('Loop Sync');
    if (index > 0) this.setParamUnit({ index, value: 'Loop Sync' });
  }

  /**
   * How many native units (seconds, for start/end) one unit of this control is, if the unit is a plain
   * multiple (seconds, ms, loop steps, % of sample), else undefined. Lets a widget convert a position
   * to a value and back.
   */
  get unitScale(): number | undefined {
    const one = this.transformCurrentUnit(1);
    const two = this.transformCurrentUnit(2);
    const zero = this.transformCurrentUnit(0);
    return Number.isFinite(one) && one > 0 && zero === 0 && Math.abs(two - 2 * one) < 1e-9
      ? one
      : undefined;
  }

  /**
   * The note this frequency control is set to, as a (fractional) MIDI number, whatever its unit
   * (Hz, half steps or cents). Used by the piano.
   */
  get midiNote(): number | undefined {
    const value = this.controlValue;
    if (!Number.isFinite(value)) return undefined;
    switch (this.currentParamUnitLabel) {
      case 'Hz':
        return value > 0 ? 69 + 12 * Math.log2(value / 440) : undefined;
      case 'Half Steps':
        return value;
      case 'Cents':
        return value / 100;
      default:
        return undefined;
    }
  }

  setMidiNote(note: number) {
    let value: number;
    switch (this.currentParamUnitLabel) {
      case 'Hz':
        value = Math.round(440 * Math.pow(2, (note - 69) / 12) * 100) / 100;
        break;
      case 'Half Steps':
        value = note;
        break;
      case 'Cents':
        value = note * 100;
        break;
      default:
        return;
    }
    this.setValue(Math.min(Math.max(value, this.min), this.max));
  }

  // force the min/max/stepSize to make sure the defaultValue
  // is within their range.
  setMinMaxByDefault() {
    if (this.defaultValue > this.max) {
      this.max = this.defaultValue;
    }
    if (this.defaultValue < this.min) {
      this.min = this.defaultValue;
    }
  }

  // TODO: this should also get called on record creation
  // and replace existing defaultParam config
  setParamUnit({ index, value }) {
    if (this.currentUnitTransformIdx === index) return;

    // start and end are positions in the sample: moving to or from the Slice unit keeps the position, not the number
    const edge = this.nodeAttr === 'end' ? 'end' : this.nodeAttr === 'start' ? 'start' : undefined;
    const wasSlice = this.currentParamUnitLabel === 'Slice';
    const position = this.trackNode?.nodeType === 'sampler' && edge ? this.attrValueForType() : undefined;

    this.currentUnitTransformIdx = index;

    const { min, max, stepSize, defaultValue } =
      this.unitParamsForAttr?.[this.currentParamUnitLabel] ?? {};

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

    // TODO: for other parameters, when changing units attempt to set the current controlValue intelligently
    if (edge && Number.isFinite(position) && (wasSlice || this.currentParamUnitLabel === 'Slice')) {
      const converted = this.valueForNative(position as number);
      if (converted !== undefined) this.controlValue = Math.min(Math.max(converted, this.min), this.max);
    }
    this.applyToAudio();
    this.trackNode?.syncSliceRanges?.();
    this.saveTrackControl.perform();
  }

  /**
   * The value in this control's current unit for a position in the sample given in seconds (the unit of what
   * the audio node takes). For the Slice unit, the slice index; otherwise seconds divided by the unit's size.
   * undefined when the unit is not a plain multiple of seconds.
   */
  valueForNative(seconds: number): number | undefined {
    if (this.currentParamUnitLabel === 'Slice') {
      return this.trackNode?.sliceIndexFor(seconds, this.nodeAttr === 'end' ? 'end' : 'start');
    }
    const scale = this.unitScale;
    return scale ? Math.round((seconds / scale) * 10000) / 10000 : undefined;
  }

  /** Whether a waveform can drag this (start or end) control: its unit is seconds-like, or it is the Slice unit. */
  get supportsRegionHandles(): boolean {
    return this.currentParamUnitLabel === 'Slice' || this.unitScale !== undefined;
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
    yield waitUntil(() => !this.isSaving);
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

  /**
   * The `this.controls` object scripts see. It is an array with one entry per track node (so
   * `controls[0].frequency` keeps working), also addressable by the node's script `id` or its type
   * (`controls.lead.frequency`, `controls.sine.frequency`; the first node of a type wins).
   *
   * It is live: reading an attr returns the user's current value (native units, current step for
   * multisliders) and assigning one sets a one-step modulation, so a script can do
   *   this.controls.lead.frequency = this.controls.lead.frequency * (1 + jitter)
   * every step without the offset compounding or touching what the slider shows.
   */
  static liveControlsForScript(trackNodes, stepIndex) {
    const entries = trackNodes.map((trackNode) => {
      const entry = { node: trackNode.nodeType, nodeUUID: trackNode.nodeUUID };
      if (trackNode.nodeType === 'sampler') {
        // read-only: how many slices the sample's onsets make (0 until it has been analysed), and where
        // they start and end, in seconds: [[0, 0.41], [0.41, 0.9], ...]
        Object.defineProperty(entry, 'sliceCount', { enumerable: true, get: () => trackNode.sliceCount });
        Object.defineProperty(entry, 'slices', {
          enumerable: true,
          get: () => trackNode.sliceBoundaries.slice(1).map((end, i) => [trackNode.sliceBoundaries[i], end]),
        });
      }
      if (trackNode.nodeType === 'sampler') {
        // Aliases: a script can still say `sampler.startSlice = 3` (the first slice that plays) and
        // `sampler.endSlice = 3` (the last, inclusive). They move start and end, which hold the Slice unit's
        // meaning in seconds for the audio. Negative or unknown slices are ignored.
        const controlFor = (attr: string) => trackNode.controlFor(attr);
        const slicePosition = (edge: 'start' | 'end', slice: number) => {
          const bounds = trackNode.sliceBoundaries;
          if (!(slice >= 0) || bounds.length < 2) return undefined;
          const index = Math.min(Math.round(slice), bounds.length - 2);
          return edge === 'start' ? bounds[index] : bounds[index + 1];
        };
        (['start', 'end'] as const).forEach((edge) => {
          Object.defineProperty(entry, `${edge}Slice`, {
            enumerable: false,
            configurable: true,
            get: () => trackNode.sliceIndexFor(controlFor(edge)?.attrValueForType(stepIndex), edge),
            set: (slice) => {
              const seconds = slicePosition(edge, slice);
              if (seconds !== undefined) controlFor(edge)?.modulate(seconds);
            },
          });
        });
      }
      trackNode.trackControls.forEach((trackControl) => {
        if (trackControl.isDeleted || !trackControl.nodeAttr) return;
        Object.defineProperty(entry, trackControl.nodeAttr, {
          enumerable: true,
          configurable: true,
          get: () => trackControl.attrValueForType(stepIndex),
          set: (value) => trackControl.modulate(value),
        });
      });
      return entry;
    });

    // `controls` is an array, so a name can collide with an array method (`id: 'filter'` vs
    // `Array#filter`). A script's own id is an explicit choice and wins; a node type never
    // replaces anything. `length` and indexes are never replaced.
    const reserved = (key: string) => key === 'length' || /^\d+$/.test(key);
    trackNodes.forEach((trackNode, i) => {
      const { scriptId, nodeType } = trackNode;
      if (scriptId && !reserved(scriptId)) {
        if (scriptId in entries && !Object.prototype.hasOwnProperty.call(entries, scriptId) && !warnedIds.has(scriptId)) {
          warnedIds.add(scriptId); // once, not on every step
          console.warn(`Node id "${scriptId}" hides the array method controls.${scriptId}(); use controls[n] if you need it.`);
        }
        if (!Object.prototype.hasOwnProperty.call(entries, scriptId)) {
          Object.defineProperty(entries, scriptId, { value: entries[i], enumerable: false, configurable: true, writable: true });
        }
      }
      if (nodeType && !reserved(nodeType) && !(nodeType in entries)) {
        Object.defineProperty(entries, nodeType, { value: entries[i], enumerable: false, configurable: true, writable: true });
      }
    });
    return entries;
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

        // TODO: separate this method due to different use cases for
        // the onstep process vs interaction setting sliders
        if (sequence) {
          if (trackControl.get('trackNode.nodeType') == 'channelStrip') {
            return false;
          }
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
        }
        return acc;
      }, {});
  }

  // on/off: its only unit is the plain "Boolean" one (loop, snap, reverse...)
  get isBinary(): boolean {
    const names = this.paramUnitNames;
    return names.length === 1 && names[0] === 'Boolean';
  }

  // The interface a control has when it is not per-step: what it is made of, not always a slider. (Going back from
  // per-step mode used to turn an on/off or a choice into a slider.)
  get defaultInterfaceName() {
    if (this.isBinary) return 'toggle';
    if (this.macroSpec?.type === 'choice') return 'select';
    return 'slider';
  }
}
