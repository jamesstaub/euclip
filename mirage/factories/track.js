import { Factory } from 'ember-cli-mirage';

export default Factory.extend({
  hits: i => 4,
  steps: i => 8,
  offset: i => 0,
  filepath: i => {
    return [
      '/SequentialCircuits%20Tom/kick.mp3',
      '/Kurzweil%20K2000/hitriang.mp3',
      '/Maestro%20Rhythm%20MRQ-1/MaxV%20-%20Snare.mp3',
    ][i%3]
  },
  afterCreate(track, server) {
    server.create('init-script', { track });
    server.create('onstep-script', { track });
  }
});
