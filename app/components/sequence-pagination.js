import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { isPresent } from '@ember/utils';

export default class SequencePaginationComponent extends Component {
  @tracked page;
  @tracked pageSize;
  @tracked totalPossiblePages;

  constructor() {
    super(...arguments);
    this.page = 0;
    this.pageSize = 16; // TODO: use a responsiveness addon and dynamically set pageSize for small screens
    this.totalPossiblePages = this.pageSize / 4;
    this.autopageEnabled = true;
  }

  get pageOffset() {
    return this.pageSize * this.page;
  }

  get currentPageStartIdx() {
    return this.pageSize * this.page;
  }

  get sequencePaginated() {
    const end = this.currentPageStartIdx + this.pageSize;
    return this.args.sequence.slice(this.currentPageStartIdx, end);
  }

  get valuesPaginated() {
    const end = this.currentPageStartIdx + this.pageSize;
    return this.args.values.slice(this.currentPageStartIdx, end);
  }

  get totalPages() {
    return Math.ceil((this.args.sequence?.length || 0) / this.pageSize);
  }

  get indexForPage() {
    const idx = this.args.stepIndex || 0;
    const pageOffset = this.pageOffset;
    const pageSize = this.pageSize;
    const pageEnd = pageOffset + pageSize;
    if (idx >= pageOffset && idx < pageEnd) {
      return idx - pageOffset;
    } else {
      return -1;
    }
  }

  get paginationButtons() {
    const pages = [...Array(this.totalPages).keys()];
    const pageSpacers = [...Array(this.totalPossiblePages - this.totalPages)];
    return [...pages, ...pageSpacers];
  }

  get pageForStepIndex() {
    const idx = this.args.stepIndex || 0;
    return Math.floor(idx / this.pageSize);
  }

  get showPages() {
    return this.totalPages > 1;
  }

  @action
  setPage(idx) {
    this.autopageEnabled = false;
    if (isPresent(idx)) {
      this.page = idx;
    }
  }

  @action
  autoPageOnUpdate(sequence, stepIndex, isCurrentTrack) {
    // change page if sequence length eliminates page
    // or playhead advances to next
    if (!isCurrentTrack) {
      this.autopageEnabled = true;
    }

    if (this.page + 1 > this.totalPages) {
      this.page = 0;
      this.autopageEnabled = true;
    }

    if (this.autopageEnabled) {
      //re-enable when exiting a track route
      const targetPage = this.pageForStepIndex;
      if (targetPage != this.page) {
        return (this.page = targetPage);
      }
    }
  }

  @action
  // takes the pageValues array, which is a subset of the total trackControl.values array
  // and updates the trackControl.values array with the new pageValues in place
  updateSequencePage(trackControl, pageValues) {
    const sequence = trackControl.controlArrayValue.map((val, idx) => {
      if (idx >= this.pageOffset && idx < this.pageOffset + this.pageSize) {
        return pageValues[idx - this.pageOffset];
      }
      return val;
    });
    this.args.updateControl(trackControl, sequence);
  }
}
