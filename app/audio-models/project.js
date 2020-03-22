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
        id: 'master-compressor',
        class: `project-${this.id}`,
      })
      .dac();
    
    this.trigger('initTracks');
  }

  startLoop() {
    __.loop('start');
    __.loop(200);
    this.isPlaying = true;
  }

  stopLoop() {
    this.set('isPlaying', false);
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
