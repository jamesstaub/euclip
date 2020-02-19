import NexusBase from './nexus-base';
import { alias } from '@ember/object/computed';
import { set, computed, observer } from '@ember/object';

const LENGTH_MULTIPLE = 34.1;
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
        size: [this.sequence.length * LENGTH_MULTIPLE, 30],
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
    this.updateAndCacheSequence();
  },

  updateAndCacheSequence() {
    let refreshOnUpdate = this.sequence !== this._sequence;
    if (refreshOnUpdate) {
      this.nexusInit();
      if (this.sequence) {
        this.sequencer.matrix.set.row(0, this.sequence);
      }
    }
    set(this, '_sequence', this.sequence);
  },

  // eslint-disable-next-line ember/no-observers
  // eslint-disable-next-line complexity
  onStepChange: observer('stepIndex', function() {
    if (this.sequence && this.sequencer) {
      if (this.sequencer && typeof this.sequencer.stepper.value === 'number') {
        let step = (this.stepIndex % this.sequencer.stepper.max) - 2;

        if (!this.stepIndex) {
          step = this.sequencer.stepper.max - 2;
        }
        this.sequencer.stepper.value = step;
      }
      this.sequencer.next();
    }
  }),

  nexusInit() {
    this._super(...arguments);
    this.sequencer.matrix.set.row(0, this.sequence);
    this.sequencer.colorize('accent', '#52ebff');
    this.sequencer.colorize('fill', '#ffffff');
    this.sequencer.colorize('mediumLight', '#d9534f');
  },

});
