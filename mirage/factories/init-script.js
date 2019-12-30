import { Factory, trait } from 'ember-cli-mirage';

export default Factory.extend({
  safeCode: i => {
    return `
  __()
    .sampler({
      id: this.id,
      path: this.filepath,
      class: 'multislider'
    })
    .gain({ 
      class: 'slider'
    })
    .gain({
      class: 'multislider',
    })
    .connect('#master-compressor');
  `
  }    
 });
