import { Factory, association } from 'ember-cli-mirage';

export default Factory.extend({
  hits: i => i + 1,
  steps: i => (i + 1) * 4,
  offset: i => i,
  afterCreate(track, server) {
    server.create('init-script', { track });
    server.create('onstep-script', { track });
  }
});
