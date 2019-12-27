import { Factory, trait } from 'ember-cli-mirage';

export default Factory.extend({
  code: i => {
    return `
if (data) {
  __(this.selector).stop();
  __(this.selector).start();
} 
`
  }
});
