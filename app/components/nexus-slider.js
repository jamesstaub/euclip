import NexusBase from './nexus-base';
import { computed } from '@ember/object';
import { alias } from '@ember/object/computed';

export default NexusBase.extend({
  slider: alias('nexusElement'),

  init() {
    this._super(...arguments);
    this.setProperties({
      elementName: 'Slider',
    });
  },

  options: computed('max', 'step', 'value', 'size', {
    get() {
      return {
        'size': this.size || [20, 70],
        'mode': 'relative', // "absolute" or "relative"
        'min': 0,
        'max': this.max || 1,
        'step': this.step || 0,
        'value': this.value
      };
    }
  }),

  nexusInit() {
    this._super(...arguments);
    console.log('gain', this.slider);
    this.slider.colorize('accent', '#52ebff');
    this.slider.colorize('fill', '#ffffff');
  },

});
