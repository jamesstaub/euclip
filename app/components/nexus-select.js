import NexusBase from './nexus-base';
import { alias } from '@ember/object/computed';
import { computed } from '@ember/object';
import { task, waitForProperty } from 'ember-concurrency';

export default NexusBase.extend({
  select: alias('nexusElement'),
  
  init() {
    this._super(...arguments);
    this.setProperties({
      elementName: 'Select',
    });
  },

  didReceiveAttrs() {
    if(this.value) {
      this.setInitialValue.perform();
    }
  },
  
  setInitialValue: task( function* () {
    yield waitForProperty(this, 'select');
    if (this.value !== this.select.value) {      
      this.select.value = this.value;
    }
  }),

  options: computed('selectOptions', {
    get() {
      return {
        options: this.selectOptions,
      };
    },
  }),
});
