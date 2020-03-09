import Component from '@ember/component';
import { guidFor } from '@ember/object/internals';

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
    if (this.options && this.nexusElement && this.value !== this.nexusElement.value) {
      this.nexusInit();
    }
  },

  nexusInit() {
    this._super(...arguments);
    if (this.nexusElement) {
      this.nexusElement.destroy();
    }
    const nexusElement = new Nexus[this.elementName](`#${this.nexusId}`, this.options);
    this.set('nexusElement', nexusElement);
    this.nexusElement.on('change', (v) => {
      this.set('value', v);
      if (this.onChangeValue) {
        this.onChangeValue(v, this.nexusElement);
      }
    });
  },

  willDestroyElement() {
    this.nexusElement.destroy();
  }
});
