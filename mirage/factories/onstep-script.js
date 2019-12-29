import { Factory, trait } from 'ember-cli-mirage';

export default Factory.extend({
  safeCode: i => {
    return `
if (data) {
  __(this.selector).stop();
  __(this.selector).start();
} 
`
  }
});
