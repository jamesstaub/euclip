import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class FileSearchResultComponent extends Component {
  @tracked file;
  @tracked parentDirs;

  @action
  renderParts() {
    const parts = this.args.result.split('/');
    this.file = parts.pop();
    this.parentDirs = parts.filter((s) => s.length);
  }
}
