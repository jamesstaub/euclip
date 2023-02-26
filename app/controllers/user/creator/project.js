import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { keepLatestTask, timeout } from 'ember-concurrency';

export default class UserCreatorProjectController extends Controller {
  @service router;
  @tracked activeTrack;
  @tracked leftSidebarOpen;
  @tracked rightSidebarOpen;
  @tracked _sortedTracks;

  constructor() {
    super(...arguments);
    this.rightSidebarOpen = true;
  }

  async fetchAudioFileTrees(project) {
    const tracks = await project.tracks;
    // OPTIMIZE: bundle this in a single request and set to each track
    tracks.forEach((track) => track.createAudioFileTree());
  }

  // see note below if weirdness occurs
  get sortedTracks() {
    if (this.model.tracks.isFulfilled) {
      this._sortedTracks = this.model.tracks.sortBy('order');
      return this._sortedTracks;
    } else {
      return this._sortedTracks;
    }
  }

  @action
  transitionToTrack(id) {
    this.router.transitionTo(
      'user.creator.project.track',
      this.model.tracks.findBy('id', id)
    );
  }

  @keepLatestTask
  *updateProject(key, value) {
    this.model.set(key, value);
    if (this.model.isPlaying) {
      this.model.startLoop();
    }
    yield timeout(1000);
    this.model.save();
  }

  @action
  async addTrack() {
    let track = this.model.tracks.createRecord({ hits: 1 });
    // NOTE this is potentially a bad idea but the cached value in the sortedTracks getter above
    // prevents a flicker when adding tracks
    this._sortedTracks.push(track);
    try {
      track = await this.model.setupAndSaveNewTrack(track);
    } catch (error) {
      // TODO: implement offline track creation if save fails
      // indicate with a global "saved" state to allow local changes
      // useful for mutliperson editing scenarios + modifying other users' projects
      track.deleteRecord();
      console.error('ERROR in addTrack:');
      console.error(error);
    }
  }

  @action
  play() {
    this.model.initSignalChain();
    this.model.startLoop();
  }

  @action
  stop() {
    this.model.stopLoop();
  }

  @action
  reset() {
    this.model.resetLoop();
    this.model.tracks.forEach((track) => {
      track.set('stepIndex', null);
    });
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
