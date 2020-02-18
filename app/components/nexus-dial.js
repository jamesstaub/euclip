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

  options: computed('max', 'step', 'value', 'size', {
    get() {
      return {
        'min': 0,
        'max': this.max || 1,
        'step': this.step || 1,
        'value': this.value
      };
    }
  }),

  nexusInit() {
    this._super(...arguments);
    this.dial.colorize('accent', '#52ebff');
    this.dial.colorize('fill', '#ffffff');
  },

});
