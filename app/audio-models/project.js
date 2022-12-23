import Model from '@ember-data/model';
import { defineChannelStripMacro, startLoop, stopLoop } from '../utils/cracked';

/*
 *  base class for the project model
 *  containing methods for project-level web audio state
 */

export default class ProjectAudioModel extends Model {
  get loopInterval() {
    return (1000 * 60) / (this.bpm * 2);
  }

  initSignalChain() {
    this.disconnectAll();
    // const tracks = await this.tracks;
    // await track.initScript;
    // await track.onstepScript;
    defineChannelStripMacro();
    this.masterTrack.setupAudioFromScripts();
    this.orderedTracks.forEach((track) => track.setupAudioFromScripts());
    return this;
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
    __.loop('reset');
    return this;
  }
}
