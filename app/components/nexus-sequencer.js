import NexusBase from './nexus-base';
import { computed } from '@ember/object';
import { alias } from '@ember/object/computed';

export default NexusBase.extend({
  sequencer: alias('nexusElement'),

  init() {
    this._super(...arguments);
    this.setProperties({
      elementName: 'Sequencer',
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

  didUpdateAttrs() {
    this._super(...arguments);
    if (this.sequencer) {
      this.sequencer.stepper.value = (this.stepIndex % this.sequence.length) - 1;
      this.sequencer.next();
    }
  },

  nexusInit() {
    this._super(...arguments);
    this.sequencer.matrix.set.row(0, this.sequence);
    this.sequencer.colorize('accent', '#52ebff');
    this.sequencer.colorize('fill', '#ffffff');
    this.sequencer.colorize('mediumLight', '#d9534f');
  }
});
