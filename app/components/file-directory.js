import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class FileDirectoryComponent extends Component {
  @tracked selected;
  
  @action
  setSelectedPath() {
    if (this.args.filepath) {
      const pathDirs = this.args.filepath.split('/').filter((dir) => dir);
      this.selected = pathDirs[this.idx];
    }
  }
  
  @action
  scrollIntoView(isSelected, element) {
    if (isSelected) {
      element.scrollIntoView();
    }
  }
}
