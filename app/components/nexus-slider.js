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

  options: computed('max', 'min', 'step', 'value', 'size', {
    get() {
      return {
        'size': this.size || [20, 120],
        'mode': 'relative', // "absolute" or "relative"
        'min': this.min || 0,
        'max': this.max || 1,
        'step': this.step || 0.0125,
        'value': this.value
      };
    }
  }),

  nexusInit() {
    this._super(...arguments);
    this.slider.colorize('accent', '#52ebff');
    this.slider.colorize('fill', '#ffffff');
  },

});
