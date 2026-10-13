import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import byKey from 'euclip/utils/by-key';

/**
 * The project's sample pool, shown in the left sidebar: every sample the project uses, shared by all
 * snapshots. Rows can be previewed, renamed, used on the target sampler, and removed
 * (not while a track uses them). It is the "In this project" shelf of the sound browser; "All sounds"
 * browses the catalog.
 */
export default class ProjectSamplePoolComponent extends Component {
  @service samplePool;
  @service notifications;

  @tracked renamingId = null;

  get countText() {
    const count = this.args.project.projectSamples.length;
    return `${count} sound${count === 1 ? '' : 's'} in this project`;
  }

  get rows() {
    const { project } = this.args;
    const trackNumbers = new Map(project.tracks.map((track) => [Number(track.id), track.isMaster ? 'Main' : track.order]));
    return project.projectSamples
      .slice()
      .sort(byKey('position'))
      .map((sample) => {
        const audio = this.samplePool.audioFor(sample);
        const trackIds = [...new Set((sample.usages ?? []).map((usage) => usage.track_id))];
        return {
          sample,
          audio,
          state: audio.state,
          durationText: audio.duration == null ? '' : `${audio.duration.toFixed(2)}s`,
          usedByText: trackIds
            .map((id) => trackNumbers.get(id))
            .filter((n) => n !== undefined)
            .map((n) => `track ${n}`)
            .join(', '),
          used: trackIds.length > 0,
          // where this sample already plays on the active track ("Sampler 2"), else which tracks use it
          badge: this.args.badges?.[sample.path] ?? (trackIds.length ? this.usedByLabel(trackIds, trackNumbers) : ''),
          playing: this.samplePool.playingPath === (sample.path.startsWith('/') ? sample.path : `/${sample.path}`),
          menu: [
            { label: 'Rename', select: () => this.startRename(sample) },
            { label: 'Remove from project', select: () => this.remove(sample) },
          ],
        };
      });
  }

  usedByLabel(trackIds, trackNumbers) {
    const numbers = trackIds.map((id) => trackNumbers.get(id)).filter((n) => n !== undefined);
    return `track ${numbers.join(', ')}`;
  }

  // opening the pool brings it up to date (tracks add files to it as they pick them) and starts loading its audio
  @action
  async load() {
    await this.samplePool.refresh(this.args.project);
    this.samplePool.preload(this.args.project);
  }

  @action
  preview(sample) {
    this.samplePool.preview(sample);
  }

  @action
  startRename(sample) {
    this.renamingId = sample.id;
  }

  @action
  focusInput(element) {
    element.focus();
    element.select();
  }

  @action
  onRenameKey(sample, event) {
    if (event.key === 'Enter') this.commitRename(sample, event);
    else if (event.key === 'Escape') this.renamingId = null;
  }

  @action
  async commitRename(sample, event) {
    if (this.renamingId !== sample.id) return;
    this.renamingId = null;
    try {
      await this.samplePool.rename(sample, event.target.value);
    } catch (error) {
      this.notifications.push({ type: 'error', message: 'Could not rename the sample (is the name taken?)' });
      console.error(error);
    }
  }

  @action
  async remove(sample) {
    try {
      await this.samplePool.remove(sample);
    } catch (error) {
      this.notifications.push({ type: 'error', message: 'This sample is still used by a track' });
      console.error(error);
    }
  }

  // "Use": the sample goes where the sound browser's target card says (the browser does the work, with Undo)
  @action
  use(sample) {
    this.args.onUse?.(sample.path);
  }
}
