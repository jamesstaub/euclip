import Component from '@glimmer/component';

// The fill of a step by its value: 1 is the original cyan, the rest tell the other values apart at a glance.
// More values than colors start over from the first.
export const STEP_COLORS = ['#52ebff', '#ffd24d', '#9be564', '#ff8fb1', '#b79cff', '#ffa94d', '#5ec8a0', '#7aa7ff'];

export default class SequencerStepComponent extends Component {
  get fill() {
    const { idx, stepIndex, step } = this.args;
    if (idx === stepIndex) {
      return '#d9534f';
    } else if (step) {
      return STEP_COLORS[(Math.round(step) - 1) % STEP_COLORS.length] ?? STEP_COLORS[0];
    } else {
      return '#fff';
    }
  }

  // a track whose steps can hold more than on / off shows each step's value
  get label() {
    const { step, maxValue } = this.args;
    return step && maxValue > 1 ? Math.round(step) : null;
  }

  get textFill() {
    return this.args.idx === this.args.stepIndex ? '#fff' : '#333';
  }
}
