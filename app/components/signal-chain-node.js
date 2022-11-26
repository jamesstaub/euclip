import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class SignalChainNodeComponent extends Component {
  get isShowingChoices() {
    return this.args.activeNodeIdx === this.args.idx;
  }

  @action
  toggleMenu() {
    this.args.onToggleMenu(this.args.idx);
  }

  @action
  selectNode(node) {
    this.args.onSelectNode(node);
  }
}
