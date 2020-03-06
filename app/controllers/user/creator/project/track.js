import Controller from '@ember/controller';
import { action } from '@ember/object';
import { keepLatestTask } from 'ember-concurrency-decorators';

export default class UserCreatorProjectTrackController extends Controller {
  @keepLatestTask
  *updateTrackTask(key, value, reInit=true){
    try {
      this.model.set(key, value);
      
      if (reInit)  {
        // TODO refactor so setupAudioFromScripts does not take arguments, but ensure these models are resolved
        // const initScript = yield track.initScript;
        // track.setupAudioFromScripts(initScript);
      }
      yield this.model.save();
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
