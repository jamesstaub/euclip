import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class FileDirectoryComponent extends Component {
  @tracked selected;
  @tracked shouldScrollTo;
  
  @action
  selectItem(directory, choice, event) {
    this.args.onSelect(directory, choice);
    this.selected = choice;
    // horizontally scroll to the directory clicked in
    this.scrollIntoView(true, event.target);
  }

  @action
  setSelectedFromUrl() {
    if (this.args.filepath) {
      const pathDirs = decodeURI(this.args.filepath).split('/').filter((dir) => dir);
      this.selected = pathDirs[this.args.idx];
      this.shouldScrollTo = pathDirs[this.args.idx];
    }
  }
  
  @action
  scrollIntoView(isSelected, element) {
    if (isSelected) {     
      element.scrollIntoView({behavior: 'smooth', inline: 'end'});
    }
  }
}
