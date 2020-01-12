import Component from '@glimmer/component';
import { action } from '@ember/object';
export default class TrackContainerComponent extends Component {
  
  @action
  updateTrackSequence(value, sequencer) {
    //if sequence is different than euclidean output 
    this.args.track.set('customSequence', sequencer.matrix.pattern[0]);
    this.args.track.save();
  }
}
