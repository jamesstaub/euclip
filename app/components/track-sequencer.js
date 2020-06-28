import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { isPresent } from '@ember/utils';

export default class TrackSequencerComponent extends Component {
  @tracked page;
  @tracked pageSize;
  @tracked totalPossiblePages;

  constructor() {
    super(...arguments);
    this.page = 0;
    this.pageSize = 16;   // TODO: use a responsiveness addon and dynamically set pageSize for small screens
    this.totalPossiblePages = this.pageSize / 4;
    this.autopageEnabled = true;
  }

  get currentPageStartIdx() {
    return this.pageSize * this.page;
  }

  get sequencePaginated() {
    const end = this.currentPageStartIdx + this.pageSize;    
    return this.args.sequence.slice(this.currentPageStartIdx, end);   
  }

  get totalPages() {
    return Math.ceil((this.args.sequence?.length || 0) / this.pageSize);
  }

  get paginationButtons() {
    const pages = [...Array(this.totalPages).keys()];
    const pageSpacers = [...Array(this.totalPossiblePages - this.totalPages)];
    return [...pages, ...pageSpacers];
  }

  get pageForstepindex() {    
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
    if (this.autopageEnabled) { //re-enable when exiting a track route
      const targetPage = this.pageForstepindex;
      if (targetPage != this.page) {
        return this.page = targetPage;
      }
    }

  }
}
