import ProjectAudioModel from '../audio-models/project';
import { attr, hasMany, belongsTo } from '@ember-data/model';

export default class ProjectModel extends ProjectAudioModel {
  @attr('string') title;
  @attr('string') slug;
  @attr('number') bpm;
  @belongsTo('user') creator;
  @hasMany('track') tracks;

  async awaitAndBindTracks() {
    const tracks = await this.tracks;
    const tracksReady = await Promise.all(tracks.map(async (track) => {
      const initScript = await track.initScript;
      await track.onstepScript;
      try {
        track.bindProjectEvents(this, initScript);
      } catch (error) {
        console.error('FAILED TO BIND AUDIO');
        console.error(error);
      }
      return track;
    }));
    this.initSignalChain();
    return tracksReady;
  }

  // maybe move this to track?
  async setupAndSaveNewTrack(track, saveOptions) {
    // Optimize. dont wait to save, instead save async and unbind if save fails
    await track.save(saveOptions);
    await this.awaitAndBindTracks();
    
    if (this.isPlaying) {
      this.startLoop();
    }
    return track;
  }
}
