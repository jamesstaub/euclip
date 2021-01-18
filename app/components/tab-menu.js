import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { isPresent } from '@ember/utils';

export default class TabMenuComponent extends Component {
  @tracked selectedValue;

  get val() {
    if (isPresent(this.selectedValue)) {
      return this.selectedValue;
    }
    return this.args.selectedValue;
  }

  // set from above component
  @action
  setSelected(element, [value]) {
    this.selectedValue = value;
  }

  // set by clicking tab
  @action
  select(value) {
    this.selectedValue = value;
    this.args.onSelect(value);
  }
}
 