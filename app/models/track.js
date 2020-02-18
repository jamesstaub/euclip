import DS from 'ember-data';
import E from '../utils/euclidean';
import { tracked } from '@glimmer/tracking';
import TrackAudioModel from '../audio-models/track';
const { belongsTo, hasMany, attr } = DS;

export default class TrackModel extends TrackAudioModel {
  @tracked hits;
  @tracked steps;
  @tracked offset;
  @tracked filepath;

  @attr('string') type
  @attr('string') filepath

  @belongsTo('project') project
  
  @belongsTo('init-script') initScript
  @belongsTo('onstep-script') onstepScript

  @hasMany('track-node') trackNodes
  
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
  
  @attr() customSequence

  get sequence() {
    // TODO support for customSequence
    return E(this.hits, this.steps, this.offset);
  }

  get filepathUrl() {
    return `https://storage.googleapis.com/euclidean-cracked.appspot.com/Drum%20Machines%20mp3/${this.filepath}`;
  }
}
