import NexusBase from './nexus-base';
import { alias } from '@ember/object/computed';
import { computed } from '@ember/object';

export default NexusBase.extend({
  number: alias('nexusElement'),

  init() {
    this._super(...arguments);
    this.set('elementName', 'Number');
    this.setProperties({
      min: -100000,
      max: 100000,
      step: 0.1,
    });
  },

  options: computed('max', 'min', 'step', 'value', {
    get() {
      return {
        min: this.min,
        max: this.max,
        step: this.step,
        value: this.value,
      };
    },
  }),

  onChangeValue(value) {
    this.onChangeNumber(value);
  },

  nexusInit() {
    this._super(...arguments);
    this.number.colorize('accent', '#52ebff');
    this.number.colorize('fill', 'transparent');
  },

  // TODO
  // number boxes dont support manually entering a value that is between a given step size
  // try to interrupt the setter and change the step value to match whatever a user might enter
  // stepForFloat(float) {
  //   // const valueUserEntered = parseFloat(this.number.interactionTarget.oldValue);
  //   const decimal = float - Math.floor(float);
  //   switch (decimal) {
  //     case this.evenlyDivisible(decimal, 10):
  //       return decimal / 10;
  //     case this.evenlyDivisible(decimal, 5):
  //       return decimal / 5;
  //     case this.evenlyDivisible(decimal, 3):
  //       return decimal / 3;
  //     case this.evenlyDivisible(decimal, 2):
  //       return decimal / 2;
  //     default:
  //       return .1
  //   }
  // },

  // evenlyDivisible(a, b) {
  //   const quotient = a / b;
  //   return quotient === Math.floor(quotient);
  // }
});
