import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';

export default class TrackListItemComponent extends Component {
  @service router

  @action
  deleteTrack() {
    this.args.track.destroyAndCleanup();
  }

  @action
  duplicateTrack() {
    this.args.track.duplicate();
  }

  @action
  updateTrackSequence(idx) {
    //if sequence is different than euclidean output 
    // manually override sequence
    const seq = [...this.args.track.sequence];
    seq[idx] = Number(!seq[idx]);
    this.args.track.updateTrackTask.perform('customSequence', seq);
  }

}
