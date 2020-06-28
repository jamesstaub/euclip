import { Factory } from 'ember-cli-mirage';

const init = 
`__()
  .sampler({
    id: this.id,
    path: this.filepath,
    ui: 'multislider',
  })
  .gain({
    ui: 'multislider',
  })
  .channelStrip()
  .connect('#mixer')
`;

export default Factory.extend({
  safeCode: i => init,
  editorContent: i => init,
 });
