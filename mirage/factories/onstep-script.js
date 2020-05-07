import { Factory } from 'ember-cli-mirage';

const script = `if (data) {
  this.playSample(index);
} 
`;

export default Factory.extend({
  safeCode: i => script,
  editorContent: i => script
});
