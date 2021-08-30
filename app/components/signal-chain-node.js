import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class SignalChainNodeComponent extends Component {
  @tracked isShowingChoices;
  
  @action
  toggleChoices() {
    this.isShowingChoices = !this.isShowingChoices;
  }

  @action
  addNode(node) {
    this.isShowingChoices = false;
    this.args.onAddNode(node);
  }
}
