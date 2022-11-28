import Component from '@glimmer/component';
import { action } from '@ember/object';

import { inject as service } from '@ember/service';

import { typeOf } from '@ember/utils';

export default class DrumFilePicker extends Component {
  @service store;

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
    const track = await this.args.track;
    console.log('save audio??', filepath);
    track.get('samplerFilepathControl').set('controlStringValue', filepath);
    track.get('samplerFilepathControl').save();
    track.setupAudioFromScripts();
  }

  @action
  async onSelectItem(directory, item) {
    const fileTree = await this.args.audioFileTreeModel;
    const selection = `${directory.path}${item}`;
    if (directory.type === 'dir') {
      fileTree.appendDirectoriesData(selection);
    } else if (directory.type === 'audio') {
      this.saveFilepathControl(selection);
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
