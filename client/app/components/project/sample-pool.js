import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import byKey from 'euclip/utils/by-key';
import { buildPath } from 'euclip/components/file-picker/drum-file-sidebar';

/**
 * The project's sample pool, shown in the left sidebar: every sample the project uses, shared by all
 * snapshots. Rows can be previewed, renamed, assigned to a sampler slot of the active track, and removed
 * (not while a track uses them). "Add samples" browses the catalog and adds files to the pool.
 */
export default class ProjectSamplePoolComponent extends Component {
  @service samplePool;
  @service notifications;

  @tracked browsing = false;
  @tracked renamingId = null;

  get rows() {
    const { project, activeTrack } = this.args;
    const trackNumbers = new Map(project.tracks.map((track) => [Number(track.id), track.isMaster ? 'Main' : track.order]));
    const slots = activeTrack?.samplerNodes ?? [];
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
          // the active track's sampler slots, and whether each plays this sample
          slots: slots.map((_, index) => ({
            index,
            number: index + 1,
            assigned: (activeTrack?.sortedFilepathControls ?? []).some(
              (control) => control.nodeOrder === index && control.controlValue === sample.path
            ),
          })),
        };
      });
  }

  get hasSlots() {
    return (this.args.activeTrack?.samplerNodes?.length ?? 0) > 0;
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

  // puts the sample into one sampler slot of the active track
  @action
  async assign(sample, slot) {
    const track = this.args.activeTrack;
    if (!track) return;
    try {
      await track.setFile(slot, sample.path);
      await this.samplePool.refresh(this.args.project); // so "used by" is current
    } catch (error) {
      this.notifications.push({ type: 'error', message: 'Could not use this sample' });
      console.error(error);
    }
  }

  @action
  toggleBrowse() {
    this.browsing = !this.browsing;
  }

  // catalog: folders open, audio files are added to the pool
  @action
  async onSelectItem(directory, item) {
    const tree = this.args.audioFileTree;
    const selection = buildPath(directory.path, item);
    if (directory.type === 'dir') {
      await tree.appendDirectoriesData(selection);
    } else if (directory.type === 'audio') {
      await this.addToPool(selection);
    }
  }

  @action
  async addToPool(path) {
    try {
      await this.samplePool.add(this.args.project, path);
    } catch (error) {
      this.notifications.push({ type: 'error', message: 'Could not add the sample' });
      console.error(error);
    }
  }
}
