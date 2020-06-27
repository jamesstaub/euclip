import Controller from '@ember/controller';
import { action } from '@ember/object';
import { timeout } from 'ember-concurrency';
import { restartableTask } from "ember-concurrency-decorators";
import { filterBy } from '@ember/object/computed';
import TrackNodeModel from '../../../../models/track-node';

export default class UserCreatorProjectTrackController extends Controller {

  maxSteps = 64;
  visibleNodeIdx = 0;
  controlUi = 'controls'
  scriptUi = 'init';

  get validTrackNodes() {
    //dont try to render if record has no corresponding AudioNode
    return TrackNodeModel.validTrackNodes(this.model);
  }

  @filterBy('validTrackNodes', 'parentMacro', undefined) trackNodesForControls; // all nodes except the children of channelStrip maco
  @filterBy('validTrackNodes', 'parentMacro') channelStripTrackNodes; // the children of channelStrip maco

  // FIXME using firstObject here seems to cause a bug where, when a gain multislider node is deleted, the channelStrips gain 
  // flashes into a multislider for a second. investigate 
  get channelStripGainControl() {
    return TrackNodeModel.channelStripNode(this.model, 'gain')?.trackControls?.firstObject;;
  }

  get channelStripPannerControl() {
    return TrackNodeModel.channelStripNode(this.model, 'panner')?.trackControls?.firstObject;
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
