import NexusBase from './nexus-base';
import { computed } from '@ember/object';
import { alias } from '@ember/object/computed';
import arraysEqual from '../utils/arrays-equal';

export default NexusBase.extend({
  multislider: alias('nexusElement'),

  init() {
    this._super(...arguments);
    this.setProperties({
      elementName: 'Multislider'
    });
  },

  valueChanged() {
    return !arraysEqual(this.values, this.nexusElement.values);
  },

  options: computed('max', 'min', 'step', 'values.[]', 'size', 'numberOfSliders', {
    get() {
      let values = this.values;
      values = values.slice(0, this.numberOfSliders);
      return {
        size: this.size || [400, 120],
        min: this.min,
        max: this.max,
        candycane: 3,
        numberOfSliders: this.numberOfSliders || 4,
        step: this.step || 0,
        values: values
      };
    }
  }),

  nexusInit() {
    this._super(...arguments);
    this.multislider.colorize('accent', '#52ebff');
    this.multislider.colorize('fill', '#ffffff');
  }
});
