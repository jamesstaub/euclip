import Controller from '@ember/controller';
import { action } from '@ember/object';
import { timeout } from 'ember-concurrency';
import { restartableTask } from "ember-concurrency-decorators";
import { filterBy } from '@ember/object/computed';

export default class UserCreatorProjectTrackController extends Controller {

  maxSteps = 32;
  visibleNodeIdx = 0;
  controlUi = 'controls'
  scriptUi = 'init';

  @filterBy('model.trackNodes', 'nodeUUID') validTrackNodes; //dont try to render if record has no corresponding AudioNode
  @filterBy('validTrackNodes', 'parentMacro', undefined) trackNodesForControls; // all nodes except the children of channelStrip maco
  @filterBy('validTrackNodes', 'parentMacro') channelStripAudioNodes; // all nodes except the children of channelStrip maco

  // FIXME using firstObject here seems to cause a bug where, when a gain multislider node is deleted, the channelStrips gain 
  // flashes into a multislider for a second. investigate 
  get channelStripGainControl() {
    return this.channelStripAudioNodes?.firstObject?.trackControls?.firstObject;
  }

  get channelStripPannerControl() {
    return this.channelStripAudioNodes?.lastObject?.trackControls?.firstObject;
  }

  get trackNodesTabs() {    
    return this.trackNodesForControls.map((trackNode, idx) => {
      return {
        label: trackNode.nodeType,
        value: idx, // the node index sets which tab is visible with template logic
      }
    })
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
