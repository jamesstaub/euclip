import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class InfoBoxComponent extends Component {
  @tracked open;

  @action
  toggleInfo() {
    this.open = !this.open;
  }
}
