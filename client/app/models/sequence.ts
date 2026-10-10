import Model, { attr, belongsTo } from '@ember-data/model';
// @ts-ignore - Module resolution issues with mixed .js/.ts files
import type TrackModel from 'euclip/models/track';
// @ts-ignore - No type definitions available
import E from '../utils/euclidean';

export default class SequenceModel extends Model {
  // @ts-ignore - Model registry types are not working properly
  @belongsTo('track', { async: false, inverse: 'sequences' }) declare track: TrackModel;

  // position within the track; the primary sequence (order 0) drives the track's step display
  @attr('number', { defaultValue: 0 }) declare order: number;

  // euclidean rhythm params (should eventually move to a Sequence model)
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

  get sequence(): number[] {
    if (this.customSequence?.length) {
      return this.customSequence;
    } else {
      // @ts-ignore - E function types
      return E(this.hits, this.steps, this.offset);
    }
  }
}
