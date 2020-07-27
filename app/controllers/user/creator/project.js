import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class UserCreatorProjectController extends Controller {
  @tracked activeTrack;
  @tracked leftSidebarOpen;
  @tracked rightSidebarOpen;
  
  @action
  transitionToTrack(id) {
    this.transitionToRoute('user.creator.project.track', this.model.tracks.findBy('id', id));
  }

  @action
  async addTrack() {
    const track = this.model.tracks.createRecord({ hits: 1 });
    await this.model.setupAndSaveNewTrack(track);
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
