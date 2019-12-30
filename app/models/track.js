import DS from 'ember-data';
import E from '../utils/euclidean';
import { tracked } from '@glimmer/tracking';
import TrackAudioModel from '../audio-models/track';
const { belongsTo, hasMany, attr } = DS;

export default class TrackModel extends TrackAudioModel {
  @tracked hits;
  @tracked steps;
  @tracked offset;
  @tracked customSequence;

  @attr('string') type
  @attr('string') filepath

  @belongsTo('project') project
  
  @belongsTo('init-script') initScript
  @belongsTo('onstep-script') onstepScript

  @hasMany('track-control') trackControls
  
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
