import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class UserCreatorProjectController extends Controller {
  @tracked activeTrack;
  @tracked sidebarOpen;

  @action
  transitionToTrack(id) {
    this.transitionToRoute('user.creator.project.track', this.model.tracks.findBy('id', id));
  }

  @action
  async addTrack() {
    const track = this.model.tracks.createRecord({ hits: 1 });
    this.model.setupAndSaveNewTrack(track);
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
  toggleSidebar(trackId) {
    const shouldToggle = trackId === this.activeTrack.id || !this.sidebarOpen;
    if (shouldToggle) {
      this.sidebarOpen = !this.sidebarOpen;
    }
    if (!trackId) {
      this.sidebarOpen = false;
    }
  }

}
