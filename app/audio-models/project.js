import Model from '@ember-data/model';
import { resetLoop, startLoop, stopLoop } from '../utils/cracked';

/*
 *  base class for the project model
 *  containing methods for project-level web audio state
 */

export default class ProjectAudioModel extends Model {
  // TODO: move bpm to ms into a common place with audio-param-config transform functions
  get loopInterval() {
    return (1000 * 60) / (this.bpm * 2);
  }

  async initSignalChain() {
    this.disconnectAll();
    this.masterTrack.setupAudioFromScripts();
    await this.downloadTrackSamples();
    this.orderedTracks.map((track) => track.setupAudioFromScripts());
    return this;
  }

  async downloadTrackSamples() {
    return await Promise.all(
      this.orderedTracks.map((track) => track.findOrDownloadSoundFile())
    );
  }

  startLoop() {
    startLoop(this.loopInterval);
    this.isPlaying = true;
    return this;
  }

  stopLoop() {
    this.isPlaying = false;
    stopLoop();
    return this;
  }

  disconnectAll() {
    // remove all existing cracked audio nodes
    __('*').unbind('step');
    __.reset();
    return this;
  }

  resetLoop() {
    this.stepIndex = -1;
    this.tracks.forEach((track) => (track.stepIndex = -1));
    resetLoop();
    return this;
  }
}
