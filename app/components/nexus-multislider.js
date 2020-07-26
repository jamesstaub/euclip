import NexusBase from './nexus-base';
import { computed } from '@ember/object';
import { alias } from '@ember/object/computed';
import arraysEqual from '../utils/arrays-equal';

export default NexusBase.extend({
  multislider: alias('nexusElement'),

  init() {
    this._super(...arguments);
    this.setProperties({
      elementName: 'Multislider',

    });
  },

  valueChanged() {
    return !arraysEqual(this.values, this.nexusElement.values);
  },

  options: computed('max', 'min', 'width', 'step', 'values.[]', 'size', {
    get() {
      const height = 120;
      const size = [this.width, height];
      return {
        size: size,
        min: this.min,
        max: this.max,
        candycane: 3,
        numberOfSliders: this.values.length,
        step: this.step,
        values: this.values
      };
    }
  }),

  nexusInit() {
    this._super(...arguments);
    this.multislider.colorize('accent', '#52ebff');
    this.multislider.colorize('fill', '#ffffff');
  }
});
