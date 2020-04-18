import { Factory } from 'ember-cli-mirage';

const init = `
__()
  .sampler({
    id: this.id,
    path: this.filepath,
    ui: 'multislider',
  })
  .gain({ 
    ui: 'slider'
  })
  .gain({
    ui: 'multislider',
  })
  .connect('#master-compressor');
`;
export default Factory.extend({
  safeCode: i => init,
  editorContent: i => init,
 });
