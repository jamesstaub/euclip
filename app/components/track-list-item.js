import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import {
  inject as controller
} from '@ember/controller';


export default class TrackListItemComponent extends Component {
  @service router
  @controller('user.creator.project') project;

  @action
  deleteTrack() {
    this.args.track.destroyAndCleanup();
  }

  @action
  async duplicateTrack() {
    await this.args.track.duplicate();
  }

  @action
  updateTrackSequence(idx) {
    //if sequence is different than euclidean output 
    // manually override sequence
    const seq = [...this.args.track.currentSequence.sequence];
    seq[idx] = Number(!seq[idx]);
    this.args.track.currentSequence.set('customSequence', seq);
    this.args.track.currentSequence.save();
    this.args.track.setupAudioFromScripts();
  }
}