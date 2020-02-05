import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency-decorators';

export default class UserCreatorProjectController extends Controller {
  @tracked activeTrack;
  @tracked drumMenuOpen;

  @task
  *saveTrackTask(track){
    try {
      yield track.save();
    } catch (e) {
      track.rollbackAttributes();
    }
  }
  @action
  openDrumMenu(id) {
    this.drumMenuOpen = true;
  }

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
    this.model.tracks.forEach((track)=>{
      track.set('stepIndex', 0);
    })
  }

}
