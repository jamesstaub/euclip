import { Factory, association } from 'ember-cli-mirage';

export default Factory.extend({
  hits: i => __.random(1, 6),
  steps: i => __.random(8,16),
  offset: i => i,
  filepath: i => {
    return [
      'Drum%20Machines%20mp3/Kurzweil%20K2000/hitriang.mp3',
      'Drum%20Machines%20mp3/Maestro%20Rhythm%20MRQ-1/MaxV%20-%20Snare.mp3',
      'Drum%20Machines%20mp3/SequentialCircuits%20Tom/kick.mp3',
    ][i%3]
  },
  afterCreate(track, server) {
    server.create('init-script', { track });
    server.create('onstep-script', { track });
  }
});
