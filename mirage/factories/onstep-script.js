import { Factory } from 'ember-cli-mirage';

const script = `

if (data) {
  __(this.selector).stop();
  __(this.selector).start();
} 
`;

export default Factory.extend({
  safeCode: i => script,
  editorContent: i => script
});
