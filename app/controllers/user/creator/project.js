import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class UserCreatorProjectController extends Controller {
  @tracked activeTrack;

  @action
  transitionToTrack(id) {
    this.transitionToRoute('user.creator.project.track', this.model.tracks.findBy('id', id));
  }

  @action
  addTrack() {
    const track = this.model.tracks.createRecord();
    track.save();
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

}
