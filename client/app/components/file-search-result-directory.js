import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class FileSearchResultDirectoryComponent extends Component {
  @tracked truncated = true;

  limit = 4;

  get truncatedFiles() {
    return this.args.result.files.slice(0, this.limit);
  }

  @action
  toggleTruncated() {
    this.truncated = !this.truncated;
  }
}
