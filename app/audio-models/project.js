import Model from '@ember-data/model';
import Evented from '@ember/object/evented';

/* 
 *  base class for the project model
 *  containing methods for project-level web audio state
 */
export default class ProjectAudioModel extends Model.extend(Evented) {
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
  }

  startLoop() {
    __.loop('start');
    __.loop(100);
    this.isPlaying = true;
  }

  stopLoop() {
    this.isPlaying = false;
    __.loop('stop');
    __('*').stop();
  }

  disconnectAll() {
    // remove all existing cracked audio nodes
    __('*').unbind('step');
    __.reset();
  }

  resetLoop() {
    __.loop('reset');
  }
}
