import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class FileDirectoryComponent extends Component {
  @tracked selected;
  @tracked shouldScrollTo;

  @action
  selectItem(directory, item) {
    this.args.onSelectItem(directory, item);
    directory.onSelectItem(item);
  }
}
