import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class FileDirectoryComponent extends Component {
  @tracked selected;
  @tracked shouldScrollTo;
  @tracked scrollBehavior;

  constructor() {
    super(...arguments);
    this.scrollBehavior = 'auto';
  }

  @action
  selectItem(directory, item) {
    /**
     * FIXME: applying scrollbehavior dynamically doesn't work well for the the top level
     * directory for some reason
     */
    this.scrollBehavior = 'smooth';
    this.args.onSelectItem(directory, item);
    directory.onSelectItem(item);
  }
}
