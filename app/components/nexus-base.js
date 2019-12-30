import Component from '@ember/component';
import { guidFor } from '@ember/object/internals';

export default Component.extend({
  init() {
    this._super(...arguments);
    this.set('nexusId', `nexus-${guidFor(this)}`);
  },

  didInsertElement() {
    this.nexusInit();
  },

  nexusInit() {
    this._super(...arguments);
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
