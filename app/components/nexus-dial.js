import NexusBase from './nexus-base';
import { computed } from '@ember/object';
import { alias } from '@ember/object/computed';

export default NexusBase.extend({
  dial: alias('nexusElement'),

  init() {
    this._super(...arguments);
    this.setProperties({
      elementName: 'Dial',
    });
  },

  options: computed('max', 'min', 'step', 'value', 'size', {
    get() {
      return {
        min: this.min || 0,
        max: this.max || 1,
        step: this.step || 1,
        size: [60, 60],
        value: this.value,
        interaction: 'vertical',
      };
    },
  }),

  nexusInit() {
    this._super(...arguments);
    this.dial.colorize('accent', '#000000');
    this.dial.colorize('fill', '#ffffff');
  },
});
