import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { inject as controller } from '@ember/controller';
import byKey from 'euclip/utils/by-key';
import { assignSound, clearSound, nextEmptySampler, offerUndo, samplerSlots, soundName } from 'euclip/utils/sampler-files';

export default class TrackListItemComponent extends Component {
  @service router;
  @service store;
  @controller('user.creator.project') projectController;

  @service projectUi;
  @service notifications;
  @service samplePool;

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

  // a sound dragged from the browser onto this row: it goes to the track's first empty sampler
  @action
  async dropSound(path) {
    const { track } = this.args;
    const target = nextEmptySampler(track, -1);
    if (!samplerSlots(track).length) {
      this.notifications.push({ type: 'warning', message: `Track ${track.order} has no sampler`, timeout: 4000 });
      return;
    }
    if (!target) {
      this.notifications.push({
        type: 'warning',
        message: `Every sampler of track ${track.order} has a sound: drop on a sampler card to replace one`,
        timeout: 5000,
      });
      return;
    }
    this.notifications.dismissGroup('undo');
    const previous = await assignSound(track, target.slot, path);
    this.samplePool.refresh(track.project);
    offerUndo(this.notifications, `${soundName(path)} added to track ${track.order}`, () =>
      (previous ? assignSound(track, target.slot, previous) : clearSound(track, target.slot)).then(() =>
        this.samplePool.refresh(track.project)
      )
    );
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

  // Clicking a step cycles its value through 0..maxValue (1 is a plain on / off toggle); `direction` is 1 for
  // a click and -1 for a right click. A track with several sampler files has a value for each, to choose which plays.
  @action
  updateTrackSequence(idx, direction = 1) {
    const sequence = this.args.track.currentSequence;
    const values = sequence.maxValue + 1;
    const steps = [...sequence.sequence];
    steps[idx] = (((Math.round(steps[idx]) + direction) % values) + values) % values;

    // which means this is now a custom sequence (not euclidean algorithm)
    this.args.track.updateTrackSequence(sequence, 'customSequence', steps);
  }
}
