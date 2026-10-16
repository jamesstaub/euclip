import Model, { attr, belongsTo } from '@ember-data/model';
// @ts-ignore - Module resolution issues with mixed .js/.ts files
import type TrackModel from 'euclip/models/track';
// @ts-ignore - No type definitions available
import E from '../utils/euclidean';
// @ts-ignore - No type definitions available
import { binaryPattern, onOffPattern } from '../utils/sequence-patterns';

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

  @attr() declare customSequence: number[] | undefined;

  // the number of steps the pattern actually has (`steps` only describes euclidean sequences)
  get length(): number {
    return this.sequence.length;
  }

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
