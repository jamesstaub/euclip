import Component from '@glimmer/component';
import { action } from '@ember/object';

import { tracked } from '@glimmer/tracking';
export default class DropdownMenuComponent extends Component {
  @tracked open = false;
  
  @action
  toggleOpen() {
    this.open = !this.open;
  }
}
