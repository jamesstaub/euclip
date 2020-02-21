import { Factory } from 'ember-cli-mirage';

export default Factory.extend({
  safeCode: i => {
    return `
    console.log("FILEPATH", this.filepath)
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
