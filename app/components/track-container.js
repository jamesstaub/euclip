import Component from '@glimmer/component';
import { action } from '@ember/object';
export default class TrackContainerComponent extends Component {
  
  @action
  updateTrackSequence(value, sequencer) {
    // if different than euclidean
    this.args.track.set('customSequence', sequencer.matrix.pattern[0]);
    // this.args.track.save();
  }
}