import { Factory } from 'ember-cli-mirage';

const init = `
__()
  .sampler({
    id: this.id,
    path: this.filepath,
    class: 'multislider',
  })
  .gain({ 
    class: 'slider'
  })
  .gain({
    class: 'multislider',
  })
  .connect('#master-compressor');
`;
export default Factory.extend({
  safeCode: i => init,
  editorContent: i => init,
 });
