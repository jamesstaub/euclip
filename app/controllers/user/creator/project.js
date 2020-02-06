import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency-decorators';

export default class UserCreatorProjectController extends Controller {
  @tracked activeTrack;
  @tracked drumMenuOpen;

  @task
  *saveTrackTask(track, reInit=true){
    try {
      yield track.save();
      if (reInit)  {
        // TODO refactor so setupAudioFromScripts does not take arguments, but ensure these models are resolved
        const initScript = yield track.initScript;
        track.setupAudioFromScripts(initScript);
      }
    } catch (e) {
      track.rollbackAttributes();
    }
  }
  @action
  openDrumMenu() {
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
