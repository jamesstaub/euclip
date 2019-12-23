import { Factory, association } from 'ember-cli-mirage';

export default Factory.extend({
  hits: i => i,
  steps: i => i * 4,
  offset: i => 0,
  afterCreate(track, server) {
    server.create('init-script', { track });
    server.create('onstep-script', { track });
  }
});
