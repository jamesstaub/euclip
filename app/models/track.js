import DS from 'ember-data';
import E from '../utils/euclidean';
import { tracked } from '@glimmer/tracking';

const { Model, hasMany, belongsTo, attr } = DS;

export default class TrackModel extends Model {
  @tracked hits;
  @tracked steps;
  @tracked offset;
  @tracked customSequence;

  @attr('string') type
  @belongsTo('project') project
  @belongsTo('script') onstepScript
  @belongsTo('script') initScript
  
  // euclidean rhythm params
  @attr('number', {
    defaultValue() { return 0 }
  }) hits

  @attr('number', {
    defaultValue() { return 8 }
  }) steps

  @attr('number', {
    defaultValue() { return 0 }
  }) offset

  
  @attr('array') customSequence

  get sequence() {
    return this.customSequence || E(this.hits, this.steps, this.offset)
  }
}
