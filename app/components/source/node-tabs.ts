import Component from '@glimmer/component';
import type { Tab } from '../console/tab-menu';
import { tracked } from '@glimmer/tracking';
import type TrackNodeModel from 'euclip/models/track-node';

export default class SourceNodeTabsComponent extends Component {
  @tracked filterType: string | null = null;
  get nodeTabs(): Tab[] {
    return this.args.nodes
      .map((trackNode: TrackNodeModel, idx: number): Tab => ({
        label: trackNode.nodeType,
        // TODO trackNode.uniqueSelector copy to clipboard
        order: trackNode.order,
        value: idx,
      }))
      .sort((a: Tab, b: Tab) => a.order - b.order);
  }
}
