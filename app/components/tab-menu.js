import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class TabMenuComponent extends Component {
  @tracked selectedValue

  @action
  select(value) {
    this.selectedValue = value;
    this.args.onSelect(value);
  }
}
 