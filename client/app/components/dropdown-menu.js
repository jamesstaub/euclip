import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class DropdownMenuComponent extends Component {
  @action
  onSelectItem(itemAction, closeAction) {
    itemAction();

    if (this.args.closeOnSelect) {
      closeAction();
    }
  }
}
