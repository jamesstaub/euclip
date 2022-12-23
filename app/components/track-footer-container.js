import Component from '@glimmer/component';
import { action } from '@ember/object';
import TrackNodeModel from '../models/track-node';
import { tracked } from '@glimmer/tracking';
import { inject as controller } from '@ember/controller';

export default class TrackFooterContainerComponent extends Component {
  @tracked controlUiState;
  @tracked visibleNodeIdx;
  @tracked showReference;

  @controller('user.creator.project') project;

  constructor() {
    super(...arguments);
    this.maxSteps = 64;
    this.visibleNodeIdx = 0;
    // this.setTabs();
    this.showReference = false;
    this.controlUiState = 'sequence';
  }

  get showSequence() {
    return this.controlUiState === 'sequence';
  }

  get showSource() {
    return this.controlUiState === 'source';
  }

  get showControls() {
    return this.controlUiState === 'controls';
  }

  get validTrackNodes() {
    //dont try to render if record has no corresponding AudioNode
    return TrackNodeModel.validTrackNodes(this.args.track);
  }

  get trackNodesForControls() {
    // all nodes except the children of channelStrip maco
    return this.validTrackNodes.filterBy('parentMacro', undefined);
  }

  get channelStripTrackNodes() {
    // the children of channelStrip maco
    return this.validTrackNodes.filterBy('parentMacro');
  }

  /**
   * Optimize: these getters get called on every step of sequence
   * In all likelyhood they only need to be re-fetched when the script is updated
   * */
  get channelStripGainControl() {
    return TrackNodeModel.channelStripNode(this.args.track, 'gain')
      ?.trackControls?.firstObject;
  }

  get channelStripPannerControl() {
    return TrackNodeModel.channelStripNode(this.args.track, 'panner')
      ?.trackControls?.firstObject;
  }

  get trackNodesTabs() {
    return this.trackNodesForControls
      .map((trackNode, idx) => {
        return {
          label: trackNode.nodeType,
          order: trackNode.order,
          value: idx, // the node index sets which tab is visible with template logic
        };
      })
      .sortBy('order');
  }

  @action
  setUi(key, val) {
    this[key] = val;
  }

  @action
  toggleReference() {
    this.showReference = !this.showReference;
    this.args.toggleSidebar('right');
  }

  @action
  setTabs() {
    if (this.project.leftSidebarOpen) {
      this.controlUiState = 'source';
    } else if (!this.controlUiState) {
      this.controlUiState = 'controls';
    }
    this.visibleNodeIdx = 0;
  }

  @action
  updateControl(trackControl, value) {
    trackControl.setValue(value);
  }
}
