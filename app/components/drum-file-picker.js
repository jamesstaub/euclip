import Component from '@glimmer/component';
import { action } from '@ember/object';

import { inject as service } from '@ember/service';

import { typeOf } from '@ember/utils';
import { tracked } from '@glimmer/tracking';

export default class DrumFilePicker extends Component {
  @service store;
  @tracked selectedPath;

  get showSearchResults() {
    return this['searchResults.length'];
  }

  @action
  async search() {
    let pageToSearch = 0;
    // this sucks but when this method is called by the pagination buttons, second arg is the page
    // when called in search, second arg is the DOM event
    if (typeOf(arguments[1]) === 'number') {
      pageToSearch = arguments[1];
    }

    const results = await this.fetchDirectory.perform(
      `/search/${this.searchQuery}?include_dir=${true}&page=${pageToSearch}`
    );
    this.searchResults = results.results;
    this.currentPage = results.page;
    this.lastPage = results.last_page;
  }

  async saveFilepathControl(filepath) {
    console.log('saveFilepathControl');
    const track = await this.args.track;
    track.get('samplerFilepathControl').set('controlStringValue', filepath);

    track.get('samplerFilepathControl').save();
    track.get('setupAudioFromScripts')();
  }

  @action
  onSelectItem(directory, item) {
    if (directory.type === 'dir') {
      this.selectedPath = this.path;
      // re-build tree
      // this.onSelectDir(this.selectedPath);
    } else if (directory.type === 'audio') {
      this.saveFilepathControl(directory.path);
    }
  }

  @action
  backToBrowse() {
    this.searchResults = null;
    this.searchQuery = null;
  }

  @action
  onSelectSearchResult(result) {
    let directory = result.split('/');
    directory.pop();
    directory = `${directory.join('/')}/`;

    this.fetchDirectoriesData(directory);
    this.saveFilepathControl(result);
  }
}
