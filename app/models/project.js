import ProjectAudioModel from '../audio-models/project';
import { attr, hasMany, belongsTo } from '@ember-data/model';
import { tracked } from '@glimmer/tracking';

export default class ProjectModel extends ProjectAudioModel {
  @tracked isPlaying;

  @attr('string') title;
  @attr('string') slug;
  @attr('number') bpm;
  @belongsTo('user') creator;
  @hasMany('track') tracks;

  // maybe move this to track?
  async setupAndSaveNewTrack(track, saveOptions) {
    // need to wait to for save because orders may change
    await track.save(saveOptions);
    track.setupAudioFromScripts(false);
    this.tracks.pushObject(track);
    
    return track;
  }

  get displayTitle() {
    return this.title || 'untitled';
  }

  get masterTrack() {
    return this.tracks.findBy('isMaster', true);
  }

  get orderedTracks() {
    return this.tracks.rejectBy('isMaster');
  }
}
