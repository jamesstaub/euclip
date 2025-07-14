import Model, { attr, belongsTo } from '@ember-data/model';
// @ts-ignore - Module resolution issues with mixed .js/.ts files
import type TrackModel from 'euclip/models/track';
// @ts-ignore - No type definitions available
import E from '../utils/euclidean';

export default class SequenceModel extends Model {
  // @ts-ignore - Model registry types are not working properly
  @belongsTo('track', { async: false, inverse: 'sequence' }) declare track: TrackModel;

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
