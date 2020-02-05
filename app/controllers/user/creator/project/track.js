import Controller from '@ember/controller';
import { action } from '@ember/object';

export default class UserCreatorProjectTrackController extends Controller {
  @action
  updateControl(trackControl, value) {
    trackControl.setValue(value)
    // TODO save
  }
}
