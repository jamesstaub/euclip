import Component from '@glimmer/component';

export default class SequencerStepComponent extends Component {
  get fill() {
    const { idx, stepIndex, step } = this.args;
    if (idx === stepIndex) {
      return '#d9534f';
    } else if (step) {
      return '#52ebff';
    } else {
      return '#fff';
    }
  }
}
