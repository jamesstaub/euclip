import { action } from '@ember/object';
import Controller, {
  inject as controller
} from '@ember/controller';

export default class UserCreatorProjectTrackController extends Controller {
  @controller('user.creator.project') project;

  @action
  toggleSidebar(trackId, direction) {
    this.project.toggleSidebar(trackId, direction);
  }
}
