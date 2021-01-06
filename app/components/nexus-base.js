import Component from '@ember/component';
import { guidFor } from '@ember/object/internals';
import { computed } from '@ember/object';
import { isPresent } from '@ember/utils';
import Nexus from 'nexusui';

/* Inherited by other `nexus-[]` components for initialization of Nexus JS library component
 *
 * TODO add midi control logic here for easy mapping of tracks
 */
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
    if (this.valueShouldUpdate()) {
      this.nexusInit();
    }
  },

  isArrayElement: computed('elementName', {
    get() {
      // currently only multislider is implemented
      return ['Multislider', 'Envelope'].includes(this.elementName);
    }
  }),

  // logic for when the @value param should set the nexus element's value from above 
  // (as opposed to when the user directly interacts with it)
  // this here is the default case for most nexus- components but some like multislider override this
  valueShouldUpdate() {
    return this.nexusElement && this.options && (this.valueChanged() || this.optionsChanged());
  },
  
  // this here is the default case for most nexus- components but some like multislider override this
  valueChanged() {
    return this.value !== this.nexusElement.value;
  },

  optionsChanged() {   
    return [
      'min', 
      'max', 
      'step',
    ].filter((option) => isPresent(this[option]) && this[option] !== this.nexusElement[option]).length    
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
    if (this.nexusElement) {
      this.nexusElement.destroy();
    }
  }
});
