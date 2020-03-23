import Component from '@ember/component';
import { guidFor } from '@ember/object/internals';
import { computed } from '@ember/object';
import arraysEqual from '../utils/arrays-equal';

export default Component.extend({
  tagName: '',

  init() {
    this._super(...arguments);
    this.set('nexusId', `nexus-${guidFor(this)}`);
  },

  didInsertElement() {
    this.nexusInit();
  },

  didReceiveAttrs() {
    if (this.options && this.nexusElement && this.valueShouldUpdate()) {
      this.nexusInit();
    }
  },

  isArrayElement: computed('elementName', {
    get() {
      // currently only multislider is implemented
      return ['Multislider', 'Envelope'].includes(this.elementName);
    }
  }),

  valueShouldUpdate() {
    if (this.nexusElement) {
      if (this.isArrayElement) {       
        return !arraysEqual(this.values, this.nexusElement.values);
      } else {
        return this.value !== this.nexusElement.value;
      }
    }
    return true;
  },

  nexusInit() {
    this._super(...arguments);
    if (this.nexusElement) {
      this.nexusElement.destroy();
    }
    const nexusElement = new Nexus[this.elementName](`#${this.nexusId}`, this.options);
    this.set('nexusElement', nexusElement);
    this.nexusElement.on('change', (v) => {
      const property = this.isArrayElement ? 'values' : 'value';
      this.set(property, v);
      if (this.onChangeValue) {
        this.onChangeValue(v, this.nexusElement);
      }
    });
  },

  willDestroyElement() {
    this.nexusElement.destroy();
  }
});
