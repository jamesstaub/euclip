import Model, { attr, belongsTo } from '@ember-data/model';
// @ts-ignore - Module resolution issues with mixed .js/.ts files
import type TrackModel from 'euclip/models/track';
// @ts-ignore - No type definitions available
import E from '../utils/euclidean';
// @ts-ignore - No type definitions available
import { binaryPattern, onOffPattern } from '../utils/sequence-patterns';

// The clock rates the UI offers, as steps per tick of the project's clock. cracked divides or multiplies the
// clock by whole numbers, so every rate is 1/n or n (other ratios, like 3/2, would need a different scheme).
export const CLOCK_RATES = [0.25, 0.5, 1, 2, 4];

export type SequenceKind = 'euclidean' | 'binary' | 'onoff';

export default class SequenceModel extends Model {
  // @ts-ignore - Model registry types are not working properly
  @belongsTo('track', { async: false, inverse: 'sequences' }) declare track: TrackModel;

  // position within the track; the primary sequence (order 0) drives the track's step display
  @attr('number', { defaultValue: 0 }) declare order: number;

  // how the pattern is made: euclidean uses hits/steps/offset, binary uses value, onoff uses onSteps/offSteps/times
  @attr('string', { defaultValue: 'euclidean' }) declare kind: SequenceKind;
  @attr('number', { defaultValue: 0 }) declare value: number;
  @attr('number', { defaultValue: 1 }) declare onSteps: number;
  @attr('number', { defaultValue: 1 }) declare offSteps: number;
  @attr('number', { defaultValue: 1 }) declare times: number;

  @attr('number', {
    defaultValue() {
      return 0;
    },
  })
  declare hits: number;

  @attr('number', {
    defaultValue() {
      return 8;
    },
  })
  declare steps: number;

  @attr('number', {
    defaultValue() {
      return 0;
    },
  })
  declare offset: number;

  // steps per tick of the project's clock: 1 is the project's pace, 0.5 half of it, 2 double (see CLOCK_RATES)
  @attr('number', { defaultValue: 1 }) declare rate: number;

  // the highest value a step can hold: 1 is a plain on/off step; more lets a step choose a value (e.g. a sampler)
  @attr('number', { defaultValue: 1 }) declare maxValue: number;

  // hand-made steps: they replace the generated pattern, and each can hold 0..maxValue
  @attr() declare customSequence: number[] | undefined;

  // the number of steps the pattern actually has (`steps` only describes euclidean sequences)
  get length(): number {
    return this.sequence.length;
  }

  // the steps, as the sequencer plays them: 0 is a rest, anything else is "on" and its value is handed to the play script as `data`
  get sequence(): number[] {
    if (this.customSequence?.length) {
      return this.customSequence;
    }
    if (this.kind === 'binary') return binaryPattern(this.value);
    if (this.kind === 'onoff') return onOffPattern(this.onSteps, this.offSteps, this.times);
    // @ts-ignore - E function types
    return E(this.hits, this.steps, this.offset);
  }
}
