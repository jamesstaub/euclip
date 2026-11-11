import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class TrackSequencerComponent extends Component {
  // right click cycles a step's value the other way (and keeps the browser's context menu out of the way)
  @action
  stepBackwards(idx, event) {
    event.preventDefault();
    this.args.onClickStep(idx, -1);
  }
}
