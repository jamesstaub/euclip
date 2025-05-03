import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { inject as controller } from '@ember/controller';

import TrackNodeModel from 'euclip/models/track-node';
import TrackControlModel from 'euclip/models/track-control';
import type TrackModel from 'euclip/models/track';
import { service } from '@ember/service';
import type MediaService from 'ember-responsive';

interface TrackFooterContainerArgs {
  track: TrackModel;
}

type ControlUiState = 'sequence' | 'source' | 'controls';

interface TrackTab {
  label: string;
  order: number;
  value: number;
}

export default class TrackFooterContainerComponent extends Component<TrackFooterContainerArgs> {
  @tracked controlUiState: ControlUiState = 'controls';
  @tracked visibleNodeIdx = 0;
  @tracked showReference = false;
  
  @service media!: MediaService;

  @controller('user.creator.project')
  declare project: {
    leftSidebarOpen: boolean;
  };

  readonly maxSteps = 64;

  get showSequence(): boolean {
    return this.controlUiState === 'sequence';
  }

  get showSource(): boolean {
    return this.controlUiState === 'source';
  }

  get showControls(): boolean {
    return this.controlUiState === 'controls';
  }

  /**
   * Optimize: these getters get called on every step of sequence
   * In all likelyhood they only need to be re-fetched when the script is updated
   */
  get channelStripNode() {
    return TrackNodeModel.channelStripNode(this.args.track);
  }

  get channelStripGainControl(): TrackControlModel | undefined {
    return this.channelStripNode?.trackControls
      .toArray()
      .find((control) => control.nodeAttr === 'gain');
  }

  get channelStripPannerControl(): TrackControlModel | undefined {
    return this.channelStripNode?.trackControls
      .toArray()
      .find((control) => control.nodeAttr === 'pan');
  }

  get trackNodesTabs(): TrackTab[] {
    return this.args.track.trackNodesForControls
      .map((trackNode, idx): TrackTab => ({
        label: trackNode.nodeType,
        order: trackNode.order,
        value: idx,
      }))
      .sort((a, b) => a.order - b.order);
  }

  @action
  setUi<K extends keyof this>(key: K, val: this[K]): void {
    this[key] = val;
    this.showReference = false;
  }

  @action
  toggleReference(): void {
    this.showReference = !this.showReference;
  }

  @action
  setTabs(): void {
    if (this.project.leftSidebarOpen) {
      this.controlUiState = 'source';
    } else if (!this.controlUiState) {
      this.controlUiState = 'controls';
    }
    this.visibleNodeIdx = 0;
  }

  @action
  setControlValue(trackControl: TrackControlModel, value: number | boolean): void {
    if (trackControl.isToggle) {
      value = value ? 1 : 0;
    }
    trackControl.setValue(value as number);
  }

  @action
  async updateControlAttr(
    trackControl: TrackControlModel,
    key: keyof TrackControlModel,
    event: Event
  ): Promise<void> {
    const input = event.target as HTMLInputElement;
    const value = input.value === 'true';
    trackControl[key] = value as any;
    await trackControl.save();
  }
}
