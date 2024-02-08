import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { inject as controller } from '@ember/controller';

export default class TrackListItemComponent extends Component {
  @service router;
  @service store;
  @controller('user.creator.project') projectController;

  get showFilePicker() {
    return !!this.args.track.samplerNodes?.length;
  }

  @action
  async deleteTrack() {
    this.projectController.deleteTrack(this.args.track);
  }

  @action
  async duplicateTrack() {
    const track = await this.args.track.duplicate();
    this.projectController.sortedTracks = [
      ...this.projectController.sortedTracks,
      track,
    ].sortBy('order');
  }

  @action
  updateTrackSequence(idx) {
    //if sequence is different than euclidean output
    // manually override sequence
    const seq = [...this.args.track.currentSequence.sequence];
    // user toggle on or off a step in the sequence
    seq[idx] = Number(!seq[idx]);

    // which means this is now  a custom sequence (not euclidean algorithm)
    this.args.track.updateTrackSequence(
      this.args.track.currentSequence,
      'customSequence',
      seq
    );
  }
}
