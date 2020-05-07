import Controller from '@ember/controller';
import { action } from '@ember/object';
import { timeout } from 'ember-concurrency';
import { restartableTask, keepLatestTask } from "ember-concurrency-decorators";
import { filterBy } from '@ember/object/computed';

export default class UserCreatorProjectTrackController extends Controller {

  maxSteps = 32;
  visibleNodeIdx = 0;
  controlUi = 'controls'
  scriptUi = 'init';
  
  @filterBy('model.trackNodes', 'parentMacro', undefined) trackNodesForControls; // all nodes except the children of channelStrip maco
  @filterBy('model.trackNodes', 'parentMacro') channelStripNodes; // all nodes except the children of channelStrip maco
  
  get channelStripGainControl() {
    return this.channelStripNodes?.firstObject?.trackControls?.firstObject;
  }

  get channelStripPannerControl() {
    return this.channelStripNodes?.lastObject?.trackControls?.firstObject;
  }

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

  // FIXME this task type throws error
  // Error: Attempted to handle event `didCommit` on <track-control:1> while in state root.loaded.updated.uncommitted. 
  @restartableTask
  *saveTrackControl(trackControl) {
    yield timeout(100);
    yield trackControl.save();
  }

  @action
  setUi(key, val) {
    this.set(key, val);
  }

  @action
  updateControl(trackControl, value) {
    trackControl.setValue(value);
    this.saveTrackControl.perform(trackControl);
  }
}
