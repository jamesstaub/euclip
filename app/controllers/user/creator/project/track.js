import Controller from '@ember/controller';
import { action } from '@ember/object';
import { task } from 'ember-concurrency-decorators';

export default class UserCreatorProjectTrackController extends Controller {
  @task
  *updateTrackTask(key, value){
    try {
      this.model.set(key, value);
      // yield this.model.save();
    } catch (e) {
      this.model.rollbackAttributes();
    }
  }

  @action
  updateControl(trackControl, value) {
    trackControl.setValue(value);
    // TODO save
  }
}
