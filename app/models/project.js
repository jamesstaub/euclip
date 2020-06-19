import ProjectAudioModel from '../audio-models/project';
import DS from 'ember-data';
const { hasMany, belongsTo, attr } = DS;

export default class ProjectModel extends ProjectAudioModel {
  @attr('string') title;
  @attr('string') slug;
  @belongsTo('user') creator;
  @hasMany('track') tracks;

  async awaitAndBindTracks() {
    const tracks = await this.tracks;
    const tracksReady = await Promise.all(tracks.map(async (track) => {
      const initScript = await track.initScript;
      await track.onstepScript;
      track.bindProjectEvents(this, initScript);
      return track;
    }));
    this.initSignalChain();
    return tracksReady;
  }

  // maybe move this to track?
  async setupAndSaveNewTrack(track, saveOptions) {
    await track.save(saveOptions);
    this.awaitAndBindTracks();
    // const initScript = await track.get('initScript');
    // track.bindProjectEvents(this, initScript);
    // track.setupAudioFromScripts(initScript);
    return track;
  }
}
