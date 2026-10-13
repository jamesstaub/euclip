import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { keepLatestTask, timeout } from 'ember-concurrency';
import { defineChannelStripMacro } from '../../../utils/cracked';
import byKey from 'euclip/utils/by-key';
import applyTrackTypeControls from 'euclip/utils/apply-track-type-controls';

/**
 * Controller focused on model state and business logic.
 * UI state has been refactored to the Project::UiState component.
 */

export default class UserCreatorProjectController extends Controller {
  @service router;
  @service notifications;
  @service trackTypes;
  @service snapshotRuntime;
  @service store;
  @tracked activeTrack;
  isStarting = false;
  @tracked sortedTracks;
  @tracked presetCollections;

  constructor() {
    super(...arguments);
    defineChannelStripMacro();
  }

  async fetchAudioFileTrees(project) {
    const tracks = await project.tracks;
    // OPTIMIZE: bundle this in a single request and set to each track
    tracks.forEach((track) => track.createAudioFileTree());
  }

  async deleteTrack(track) {
    const idx = this.sortedTracks.indexOf(track);

    const isCurrentRoute =
      this.router.currentRoute.name === 'user.creator.project.track' &&
      this.router.currentRoute.params?.track_id === track.id;

    if (isCurrentRoute && this.sortedTracks.length > 1) {
      const nextRoute =
        this.sortedTracks[idx - 1] || this.sortedTracks[idx + 1];
      this.router.transitionTo('user.creator.project.track', nextRoute.id);
    }

    // take the card off screen right away; destroyAndCleanup stops its audio and deletes it
    const before = this.sortedTracks;
    this.sortedTracks = before.filter((t) => t !== track);
    try {
      await track.destroyAndCleanup();
    } catch (e) {
      this.sortedTracks = before; // the delete failed and the track was restored
      throw e;
    }

    this.sortedTracks = [
      ...this.sortedTracks.filter((t) => !t.isDeleted),
    ].slice().sort(byKey('order'));

    // never leave the URL on a track that no longer exists (a click may have navigated to it
    // while the delete was in flight)
    const { name, params } = this.router.currentRoute;
    if (name === 'user.creator.project.track' && params?.track_id === track.id) {
      const fallback = this.sortedTracks.find((t) => !t.isMaster) || this.sortedTracks[0];
      if (fallback) {
        this.router.transitionTo('user.creator.project.track', fallback.id);
      } else {
        this.router.transitionTo('user.creator.project.index');
      }
    }
  }

  @action
  // FIXME: refactor current track so it doesn't require a fetch. doesnt need to be a route
  transitionToTrack(id) {
    const trackTo = this.model.tracks.find((item) => item.id === id);
    // optimisitically set the active track
    this.activeTrack = trackTo;

    // then transition the router to the track
    trackTo && this.router.transitionTo('user.creator.project.track', trackTo);
  }

  @action
  async updateName() {
    if (this.model.hasDirtyAttributes) {
      // TODO: in the response, change the slug
      // if successfull, transition to new slug
      await this.model.save();
    }
  }

  @action
  revertName() {
    this.model.rollbackAttributes();
  }

  // TODO:
  // on update BPM, set relative tempo values on track controls
  @keepLatestTask
  *updateProject(key, value) {
    if (this.model[key] === value) return;

    this.model.set(key, value);
    if (this.model.isPlaying) {
      this.model.startLoop();
    }

    yield timeout(1000);

    try {
      // tempo belongs to the active snapshot; everything else (title...) to the project
      return yield (key === 'bpm' ? this.model.activeSnapshot : this.model).save();
    } catch (error) {
      console.error('Failed To Save Project');
    }
  }

  @action
  onTracksCreated(tracks) {
    this.sortedTracks = [...this.sortedTracks, ...tracks].slice().sort(byKey('order'));
  }

  // the "New Track" menu: one entry per track type the API offers, then the drum machine picker
  get trackTypeMenuItems() {
    return this.trackTypes.types.map((type) => ({
      label: type.title,
      select: () => this.createTrack(type.key),
    }));
  }

  // --- snapshots -------------------------------------------------------------------------------------

  // Makes a snapshot the active one: on the next step while playing (immediately when stopped).
  // The tracks are shared, so only their settings change.
  @action
  async switchSnapshot(snapshot) {
    try {
      await this.snapshotRuntime.switchTo(snapshot);
    } catch (error) {
      this.notifications.push({ type: 'error', message: 'Could not switch snapshot' });
      console.error(error);
    }
  }

  // "Save snapshot": stores the current state (tempo, control values, sequences, onstep scripts) as a new
  // snapshot. Edits always apply to the active snapshot, so nothing is lost by switching away.
  @action
  async saveSnapshot() {
    try {
      return await this.snapshotRuntime.saveCurrent(this.model);
    } catch (error) {
      this.notifications.push({ type: 'error', message: 'Could not save snapshot' });
      console.error(error);
    }
  }

  @action
  async renameSnapshot(snapshot, name) {
    const trimmed = (name ?? '').trim();
    if (!trimmed || trimmed === snapshot.name) return;
    snapshot.name = trimmed;
    await snapshot.save();
  }

  @action
  async deleteSnapshot(snapshot) {
    if (snapshot.isActive || this.model.snapshots.length <= 1) return; // switch away first
    await snapshot.destroyRecord();
  }

  @action
  async createTrack(trackTypeKey = 'sampler') {
    try {
      const type = this.trackTypes.find(trackTypeKey);
      const track = await this.model.constructor.createSingleTrack(this.model, {
        trackType: trackTypeKey,
      });
      if (type?.controls) {
        applyTrackTypeControls(track, type.controls);
      }
      this.sortedTracks = [...this.sortedTracks, track];
      return track;
    } catch (error) {
      this.notifications.push({
        type: 'error',
        message: 'Error Creating Track',
      });
      console.error(error);
    }
  }

  // One Multi-sample kit track with a sampler for each path (the sound browser's "1 kit track" action).
  // Setting the files one after another is safe: the track queues them and rebuilds its audio each time.
  @action
  async createKitFromFiles(paths) {
    const track = await this.createTrack('multi_sampler');
    if (!track) return undefined;
    for (const [slot, path] of paths.entries()) {
      await track.setFile(slot, path);
    }
    return track;
  }

  @action
  async createTracksFromFilepaths(filepathConfigs) {
    try {
      const tracks = await this.model.constructor.createMultipleTracks(
        this.model,
        filepathConfigs
      );
      this.sortedTracks = [...this.sortedTracks, ...tracks];
      return tracks;
    } catch (error) {
      this.notifications.push({
        type: 'error',
        message: 'Error Creating Tracks from File Paths',
      });
      console.error(error);
      return [];
    }
  }

  @action
  async play() {
    if (this.isStarting) return;
    this.isStarting = true;
    try {
      this.model.stopLoop();
      this.model.resetLoop();
      // nodes (and samples) must exist before the loop starts stepping
      await this.model.initSignalChain();
      this.model.startLoop();
    } finally {
      this.isStarting = false;
    }
  }

  @action
  stop() {
    this.model.stopLoop();
  }

  @action
  pause() {
    this.model.stopLoop();
  }

  @action
  reset() {
    // this.model.resetLoop();
    // this.model.initSignalChain();
  }

  @action
  selectNextTrack() {
    const idx = this.sortedTracks.indexOf(this.activeTrack);
    const nextTrack = this.sortedTracks[idx + 1] || this.sortedTracks[0];
    return this.transitionToTrack(nextTrack.id);
  }

  @action
  selectPrevTrack() {
    const idx = this.sortedTracks.indexOf(this.activeTrack);
    const prevTrack =
      this.sortedTracks[idx - 1] || this.sortedTracks.at(-1);
    return this.transitionToTrack(prevTrack.id);
  }
}
