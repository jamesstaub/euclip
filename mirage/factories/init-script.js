import { Factory, trait } from 'ember-cli-mirage';

export default Factory.extend({
  code: i => {
    return `
  __()
    .sampler({
      id: this.samplerId,
      path: this.path,
      class: this.className
    })
    .gain({
      id: this.gainId, // assign gainID to connect to the track's main volume slider
    })
    .gain({ // onstep gain controlled by multislider
      class: this.className,
    })
    .connect('#master-compressor');
  `
  }    
 });
