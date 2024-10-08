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
    this.controlUiState = 'controls';
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

  /**
   * Optimize: these getters get called on every step of sequence
   * In all likelyhood they only need to be re-fetched when the script is updated
   * */
  get channelStripNode() {
    return TrackNodeModel.channelStripNode(this.args.track);
  }

  get channelStripGainControl() {
    return this.channelStripNode?.trackControls
      .toArray()
      .findBy('nodeAttr', 'gain');
  }

  get channelStripPannerControl() {
    return this.channelStripNode?.trackControls
      .toArray()
      .findBy('nodeAttr', 'pan');
  }

  get trackNodesTabs() {
    return this.args.track.trackNodesForControls
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
    this.showReference = false;
  }

  @action
  toggleReference() {
    this.showReference = !this.showReference;
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
  setControlValue(trackControl, value) {
    if (trackControl.isToggle) {
      value = value ? 1 : 0;
    }
    trackControl.setValue(value);
  }

  @action
  async updateControlAttr(trackControl, key, event) {
    const value = event.target.value === 'true';
    trackControl[key] = value;
    await trackControl.save();
  }
}
