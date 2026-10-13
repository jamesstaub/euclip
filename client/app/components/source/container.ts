import Component from '@glimmer/component';
import { action } from '@ember/object';
import type { Tab } from 'euclip/components/console/tab-menu';
import { tracked } from '@glimmer/tracking';
import type TrackNodeModel from 'euclip/models/track-node';

export default class SourceContainerComponent extends Component {
  // the selected source node: shared with the file sidebar through the project UI state (clamped to this track's nodes)
  get visibleNodeIdx(): number {
    const count = (this.args as any).track?.sourceNodeRecords?.length ?? 0;
    return Math.min((this.args as any).selectedNodeIdx ?? 0, Math.max(0, count - 1));
  }

  // every source node is a sampler: the sounds are the story, shown as cards (see Source::SamplerRack)
  get isSamplerTrack(): boolean {
    const nodes = (this.args as any).track?.sourceNodeRecords ?? [];
    return nodes.length > 0 && nodes.every((node: TrackNodeModel) => node.nodeType === 'sampler');
  }

  get selectedNode() {
    return (this.args as any).track?.sourceNodeRecords?.[this.visibleNodeIdx];
  }

  @action
  setUi<K extends keyof this>(key: K, val: this[K]): void {
    this[key] = val;
  }
}
