import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class SearchPaginationComponent extends Component {
  @tracked lastPage

  @action
  selectPage(pageNum) {
    this.args.search(pageNum);
  }

  get pageNumbers() {
    return [...Array(this.args.lastPage).keys()];
  }
}
