import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class UserCreatorProjectController extends Controller {
  @tracked activeTrack;
  @tracked leftSidebarOpen;
  @tracked rightSidebarOpen;
  @tracked _sortedTracks;

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
    this.transitionToRoute('user.creator.project.track', this.model.tracks.findBy('id', id));
  }

  @action
  // OPTIMIZE:
  // Throttle this with a concurrency task
  updateProject(key, value) {
    this.model.set(key, value);
    if (this.model.isPlaying) {
      this.model.startLoop();
    }
    this.model.save();
  }

  @action
  async addTrack() {
    let track = this.model.tracks.createRecord({ hits: 1 });

    // NOTE this is potentially a bad idea but the cached value in the getter above 
    // prevents a flicker when adding tracks
    this._sortedTracks.push(track);

    try {
      track = await this.model.setupAndSaveNewTrack(track);
    } catch (error) {
      // TODO: implement offline track creation if save fails
      // indicate with a global "saved" state to allow local changes
      // useful for mutliperson editing scenarios + modifying other users' projects
      track.deleteRecord();
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
    this.model.tracks.forEach((track)=>{
      track.set('stepIndex', null);
    })
  }

  @action
  toggleSidebar(trackId, direction) {
    const sidebarProps = {
      left: 'leftSidebarOpen',
      right: 'rightSidebarOpen'
    }
    const shouldToggle = trackId === this.activeTrack.id || !this[sidebarProps[direction]];
    if (shouldToggle) {
      this[sidebarProps[direction]] = !this[sidebarProps[direction]];
    }
  }

}
