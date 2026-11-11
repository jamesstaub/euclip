import Component from '@glimmer/component';
import { CLOCK_RATES } from 'euclip/models/sequence';

const KINDS = [
  { value: 'euclidean', label: 'Euclidean', order: 0 },
  { value: 'binary', label: 'Binary', order: 1 },
  { value: 'onoff', label: 'On / Off', order: 2 },
];

// the clock rate as the tab shows it: steps per tick of the project's clock, written as a division or multiple
const RATE_LABELS = { 0.25: '1/4', 0.5: '1/2', 1: '1', 2: '2x', 4: '4x' };

export default class SequenceContainerComponent extends Component {
  kinds = KINDS;
  rates = CLOCK_RATES.map((value, order) => ({ value, label: RATE_LABELS[value], order }));

  // the "values" slider's top end: plenty for choosing between samplers, and always includes the sequence's own
  get maxStepValue() {
    return Math.max(16, this.args.sequence?.maxValue ?? 1);
  }

  get kind() {
    return this.args.sequence?.kind ?? 'euclidean';
  }
}
