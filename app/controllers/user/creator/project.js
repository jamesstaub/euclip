import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { keepLatestTask, restartableTask, timeout } from 'ember-concurrency';
import { defineChannelStripMacro } from '../../../utils/cracked';

export default class UserCreatorProjectController extends Controller {
  @service router;
  @service media;
  @service notifications;
  @tracked activeTrack;
  @tracked leftSidebarOpen;
  @tracked rightSidebarOpen;
  @tracked sortedTracks;

  constructor() {
    super(...arguments);
    this.rightSidebarOpen = this.media.isDesktop;
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
  transitionToTrack(id) {
    const trackTo = this.model.tracks.findBy('id', id);

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
    let track = this.model.tracks.createRecord({ hits: 1 });
    this.sortedTracks = [...this.sortedTracks, track];
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
  toggleSidebar(trackId, direction) {
    const sidebarProps = {
      left: 'leftSidebarOpen',
      right: 'rightSidebarOpen',
    };
    const shouldToggle =
      trackId === this.activeTrack.id || !this[sidebarProps[direction]];
    if (shouldToggle) {
      this[sidebarProps[direction]] = !this[sidebarProps[direction]];
    }
  }
}
