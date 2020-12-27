import Model from '@ember-data/model';
import Evented from '@ember/object/evented';
import { defineChannelStripMacro, createMasterDac, startLoop, stopLoop } from '../utils/cracked';

/* 
 *  base class for the project model
 *  containing methods for project-level web audio state
 */
export default class ProjectAudioModel extends Model.extend(Evented) {

  get loopInterval() {
    return 1000 * 60 / this.bpm;
  }

  initSignalChain() {
    this.disconnectAll();

    createMasterDac(this.id);
    defineChannelStripMacro();

    this.trigger('initTracks');
    return this;
  }

  startLoop() {
    startLoop(this.loopInterval);
    this.isPlaying = true;
    return this;
  }

  stopLoop() {
    this.isPlaying = false;
    stopLoop()
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
