import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class UserCreatorProjectController extends Controller {
  @tracked activeTrack;
  @tracked leftSidebarOpen;
  @tracked rightSidebarOpen;
  @tracked _sortedTracks;

  constructor() {
    super(...arguments);
    this.rightSidebarOpen = true;
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
  async addTrack(presetKey) {
    //TODO preset key should call a setup ui function for such scenarious as
    // open the preset menu (full sidebar menu with columns)
    // open the signal chain ui
    // open the drum machine UI in multi-track mode to select an entire machine
    console.log('TODO: implement preset UI ');
    let track = this.model.tracks.createRecord({ hits: 1, presetKey });
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
