import { Factory } from 'ember-cli-mirage';

export default Factory.extend({
  hits: i => i,
  steps: i => i * 4,
  offset: i => 0,
});
