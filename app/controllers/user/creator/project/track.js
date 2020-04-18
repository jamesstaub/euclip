import Controller from '@ember/controller';
import { action } from '@ember/object';
import { keepLatestTask } from 'ember-concurrency-decorators';

export default class UserCreatorProjectTrackController extends Controller {
  maxSteps = 32;
  visibleNodeIdx = 0;
  
  @keepLatestTask
  *updateTrackTask(key, value, reInit=true){
    try {
      this.model.set(key, value);
      if (reInit)  {
        // TODO refactor so setupAudioFromScripts does not take arguments, but ensure these models are resolved
        const initScript = yield this.model.initScript;
        this.model.setupAudioFromScripts(initScript);
      }
      yield this.model.save();
    } catch (e) {
      this.model.rollbackAttributes();
    }
  }

  @action
  setUi(key, val) {
    this.set(key, val);
  }

  @action
  updateControl(trackControl, value) {
    console.log('TODO save track');
    trackControl.setValue(value);
    // TODO save
  }
}
