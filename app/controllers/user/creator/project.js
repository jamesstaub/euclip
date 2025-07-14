import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { keepLatestTask, timeout } from 'ember-concurrency';
import { defineChannelStripMacro } from '../../../utils/cracked';

/**
 * Controller focused on model state and business logic.
 * UI state has been refactored to the Project::UiState component.
 */

export default class UserCreatorProjectController extends Controller {
  @service router;
  @service notifications;
  @tracked activeTrack;
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

    await track.destroyAndCleanup();

    this.sortedTracks = [
      ...this.sortedTracks.filter((t) => !t.isDeleted),
    ].sortBy('order');
  }

  @action
  // FIXME: refactor current track so it doesn't require a fetch. doesnt need to be a route
  transitionToTrack(id) {
    const trackTo = this.model.tracks.findBy('id', id);
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
      return yield this.model.save();
    } catch (error) {
      console.error('Failed To Save Project');
    }
  }

  @action
  async createTrack() {
    console.log('create track');
    let track = this.model.tracks.createRecord({ hits: 1 });
    this.sortedTracks = [...this.sortedTracks, track];
    console.log(track);

    try {
      track = await this.model.setupAndSaveNewTrack(track);
    } catch (error) {
      // TODO: implement offline track creation if save fails
      // indicate with a global "saved" state to allow local changes
      // useful for mutliperson editing scenarios + modifying other users' projects
      this.deleteTrack(track);
      this.notifications.push({
        type: 'error',
        message: 'Error Creating Track',
      });
      console.error(error);
    }
  }

  @action
  async createTracksFromFilepaths(/* filepathControls */) {
    // TODO: Implement track creation from file paths
  }

  @action
  play() {
    this.model.stopLoop();
    this.model.resetLoop();
    this.model.initSignalChain();
    this.model.startLoop();
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
      this.sortedTracks[idx - 1] || this.sortedTracks.lastObject;
    return this.transitionToTrack(prevTrack.id);
  }
}
