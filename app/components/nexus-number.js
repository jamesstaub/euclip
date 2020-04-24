import NexusBase from './nexus-base';
import { alias } from '@ember/object/computed';
import { computed } from '@ember/object';

export default NexusBase.extend({
  number: alias('nexusElement'),

  init() {
    this._super(...arguments);
    this.set('elementName', 'Number');
  },

  options: computed('max', 'min', 'step', 'value', {
    get() {
      return {
        'min': this.min,
        'max': this.max,
        'step': this.step,
        'value': this.value
      };
    }
  }),

});
