import Component from '@glimmer/component';

const KINDS = [
  { value: 'euclidean', label: 'Euclidean', order: 0 },
  { value: 'binary', label: 'Binary', order: 1 },
  { value: 'onoff', label: 'On / Off', order: 2 },
];

export default class SequenceContainerComponent extends Component {
  kinds = KINDS;

  get kind() {
    return this.args.sequence?.kind ?? 'euclidean';
  }
}
