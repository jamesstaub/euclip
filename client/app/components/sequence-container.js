import Component from '@glimmer/component';

const KINDS = [
  { value: 'euclidean', label: 'Euclidean' },
  { value: 'binary', label: 'Binary' },
  { value: 'onoff', label: 'On / Off' },
];

export default class SequenceContainerComponent extends Component {
  kinds = KINDS;

  get kind() {
    return this.args.sequence?.kind ?? 'euclidean';
  }
}
