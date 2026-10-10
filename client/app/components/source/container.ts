import Component from '@glimmer/component';
import { action } from '@ember/object';
import type { Tab } from 'euclip/components/console/tab-menu';
import { tracked } from '@glimmer/tracking';
import type TrackNodeModel from 'euclip/models/track-node';

export default class SourceContainerComponent extends Component {
  @tracked visibleNodeIdx: number = 0;
  @action
  setUi<K extends keyof this>(key: K, val: this[K]): void {
    this[key] = val;
  }
}
