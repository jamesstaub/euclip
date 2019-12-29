import Controller from '@ember/controller';
import { action } from '@ember/object';


export default class UserCreatorProjectController extends Controller {
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
