import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { inject as controller } from '@ember/controller';
import byKey from 'euclip/utils/by-key';
import { nextEmptySampler } from 'euclip/utils/sampler-files';

export default class TrackListItemComponent extends Component {
  @service router;
  @service store;
  @controller('user.creator.project') projectController;

  @service projectUi;

  get showSourceButton() {
    return !this.args.track.isMaster && !!this.args.track.sourceKind;
  }

  // The click also selects this track (the row handles it).
  // Sampler sources (one file or several) open the sound sidebar, where the sample is picked;
  // oscillators and macros have nothing to browse, so they open the footer's source tab instead.
  @action
  showSource() {
    const { sourceKind } = this.args.track;
    if (sourceKind === 'sample' || sourceKind === 'multi-sample') {
      // the browser's target: the first sampler with no sound yet (this row is not the active track yet, so say which track)
      const empty = nextEmptySampler(this.args.track, -1);
      if (empty) this.projectUi.setSelectedSourceIdx(empty.index, this.args.track.id);
      this.args.onToggleFilePicker?.();
    } else {
      this.projectUi.footerTab = 'source';
    }
  }

  // The script asks for a sampler even though no sampler node exists (script error, failed build).
  // Derived from the script text so users never have to declare a source type separately.
  get samplerBuildFailed() {
    const track = this.args.track;
    if (this.showSourceButton || track.isRemoved || !track.hasBuiltAudio) return false;
    const code = this.args.track.initScript?.safeCode ?? '';
    return /\.sampler\s*\(/.test(code);
  }

  @action
  stopPropagation(event) {
    event.stopPropagation();
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
    ].slice().sort(byKey('order'));
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
