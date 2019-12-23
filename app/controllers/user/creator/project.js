import Controller from '@ember/controller';
import { action } from '@ember/object';

export default class UserCreatorProjectController extends Controller {
  @action
  play() {
    this.model.initSignalChain();
    this.model.startLoop();
  }
}
