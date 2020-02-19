import Component from '@glimmer/component';
import { action } from '@ember/object';
export default class TrackContainerComponent extends Component {
  
  @action
  deleteTrack() {
    this.args.track.destroyRecord();
  }

  @action
  updateTrackSequence(idx) {
    //if sequence is different than euclidean output 
    // manually override sequence
    console.log(idx);
    
    // TODO throttle save with task?
    // this.args.track.save();
  }
}
