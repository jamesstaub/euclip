import NexusBase from './nexus-base';
import { computed } from '@ember/object';
import { guidFor } from '@ember/object/internals';
import { alias } from '@ember/object/computed';

export default NexusBase.extend({
  sequencer: alias('nexusElement'),

  init() {
    this._super(...arguments);
    this.setProperties({
      elementName: 'Sequencer',
      nexusId: `nexus-${guidFor(this)}`
    });
  },

  options: computed('sequence.length', {
    get() {
      return {
        size: [this.sequence.length * 34.1, 30],
        mode: 'toggle',
        rows: 1,
        columns: this.sequence.length
      }
    }
  }),

  sequence: computed({
    set(key, val) {
      if (this.sequencer) {
        this.sequencer.matrix.set.row(0, val);
      }
      return val;
    }
  }),

  didInsertElement() {
    this._super(...arguments);
    this.nexusInit();     
    this.sequencer.matrix.set.row(0, this.sequence);
    this.sequencer.colorize('accent', '#52ebff');
    this.sequencer.colorize('fill', '#ffffff');
    this.sequencer.colorize('mediumLight', '#d9534f');
  },
  
  didUpdateAttrs() {
    this._super(...arguments);
    if (this.sequencer) {
      this.sequencer.stepper.value = (this.stepIndex % this.sequence.length) - 1;
      this.sequencer.next();
    }
  },

  nexusInit() {
    if (this.sequence) {
      this._super(...arguments);
    }
  }
});
