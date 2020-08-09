import Model from '@ember-data/model';
import Evented from '@ember/object/evented';

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
    
    // create a compressor -> DAC node for other nodes to connect to
    __()
      .compressor({
        release: .1,
        id: 'mixer',
        class: `project-${this.id}`,
      })
      .dac();

    cracked.channelStrip = function(params = {}) {
      __.begin('channelStrip', params).gain(1).panner({ui: 'dial'}).end('channelStrip');
      return cracked;
    }
    this.trigger('initTracks');
    return this;
  }

  startLoop() {
    __.loop('start');    
    __.loop(this.loopInterval);
    this.isPlaying = true;
    return this;
  }

  stopLoop() {
    this.isPlaying = false;
    __.loop('stop');
    __('*').stop();
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
