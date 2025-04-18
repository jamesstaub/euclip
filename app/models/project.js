import ProjectAudioModel from '../audio-models/project';
import { attr, hasMany, belongsTo } from '@ember-data/model';
import { tracked } from '@glimmer/tracking';
import TrackControlModel from './track-control';
import FilepathControlModel from './filepath-control';

export default class ProjectModel extends ProjectAudioModel {
  @tracked isPlaying;

  @attr('string') title;
  @attr('string') slug;
  @attr('number') bpm;
  @belongsTo('user', { async: false, inverse: 'projects' }) creator;
  @hasMany('track', { async: false, inverse: 'project' }) tracks;
  @attr('number', { defaultValue: 0 }) stepIndex;

  // maybe move this to track?
  async setupAndSaveNewTrack(track, saveOptions) {
    // need to wait to for save because orders may change
    console.log(1 );
    
    await track.save(saveOptions);
    console.log(2); 
    this.tracks.pushObject(track);
    console.log(3);
    await track.findOrDownloadSoundFile();
    console.log(4);
    await track.setupAudioFromScripts(false);
    console.log(5);
    track.createAudioFileTree(); // not required to start playing, just filetree UI
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
