import Component from '@glimmer/component';
import { set, action } from '@ember/object';

import { inject as service } from '@ember/service';
import ENV from '../config/environment';
import { typeOf } from '@ember/utils';
import { tracked, cached } from '@glimmer/tracking';

class DirectoriesData {
  @tracked state = 'loading';
  @tracked value;
  @tracked reason;
}

export default class DrumFilePicker extends Component {
  @service store;

  @tracked selectedPath;

  get showSearchResults() {
    return this['searchResults.length'];
  }

  constructor() {
    super(...arguments);
    this.selectedDir = 0;

    // if (this.track && this.track.filepath) {
    //   // this.initDirectoryFromTrack.perform(this.track.filepath);
    // } else {
    //   this.updateDirectories.perform(path);
    // }
  }

  async fetchDirectory(path) {
    const url = `${ENV.APP.DRUMSERVER_HOST}${path}`;
    const response = await fetch(url);
    const json = await response.json();
    return json;
  }

  parseResponse(content) {
    const { dirs, audio } = content;
    // prefer type as audio if contains both
    content.type = audio.length ? 'audio' : 'dir';
    content.choices = audio.length ? audio : dirs;

    // choices will be either audio or dirs
    //  no need to retain these
    delete content.audio;
    delete content.dirs;

    return content;
  }

  saveFilepathControl(filepath) {
    this.track.samplerFilepathControl.set('controlStringValue', filepath);
    this.track.samplerFilepathControl.save();
    this.track.setupAudioFromScripts();
  }

  get pathToFetch() {
    return this.selectedPath || this.track?.filepath || '';
  }

  @cached
  get directoriesData() {
    // https://discuss.emberjs.com/t/how-to-force-re-render-a-glimmer-component/18150/2
    let data = new DirectoriesData();
    let path = this.pathToFetch.split('/');
    path.pop();
    let response = this.fetchDirectory(path.join('/'))
      .then(({ ancestor_tree, dirs }) => {
        data.state = 'loaded';
        data.value = dirs;
        if (ancestor_tree) {
          data.value = response.ancestor_tree.map((dir) => {
            return this.parseResponse(dir);
          });
        }
      })
      .catch((reason) => {
        data.state = 'error';
        data.reason = reason;
      });

    // clear any child directories when clicking back higher up the tree
    // if (_directories.value.path) {
    //   const pathDepth = _directories.value.path.split('/').filter((s) => s.length).length;
    //   while (_directories.value.length > pathDepth) {
    //     _directories.value.pop();
    //   }
    //   _directories.value.pushObject(_directories);
    // }
    return data;
  }

  @cached
  get directories() {
    switch (this.directoriesData?.state) {
      case 'loaded':
        return this.directoriesData.value;
      case 'loading':
        return [];
      case 'error':
        return [];
      default:
        return [];
    }
  }

  // @keepLatestTask
  // *updateDirectories(pathToFetch) {
  //   let response = yield this.fetchDirectory.perform(pathToFetch);
  //   let directory = this.parseResponse(response);
  //   // clear any child directories when clicking back higher up the tree
  //   const pathDepth = directory.path.split('/').filter((s) => s.length).length;
  //   while (this.directories.length > pathDepth) {
  //     this.directories.pop();
  //   }
  //   this.directories.pushObject(directory);
  // }

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

  @action
  backToBrowse() {
    this.searchResults = null;
    this.searchQuery = null;
  }

  @action
  onSelect(directory, choice) {
    set(directory, 'currentSelection', choice);
    let newPath = `${directory.path}${choice}`;
    let type = directory.type;
    newPath = newPath.replace('//', '/'); // hack to deal with API parsing issue
    if (type === 'dir') {
      this.selectedPath = newPath;
    } else if (type === 'audio') {
      this.saveFilepathControl(newPath);
    }
  }

  @action
  onSelectSearchResult(result) {
    let directory = result.split('/');
    directory.pop();
    directory = `${directory.join('/')}/`;

    this.updateDirectories.perform(directory);
    this.saveFilepathControl(result);
  }

  @action
  selectDir(selectedIdx) {
    this.selectedDir = selectedIdx;
  }
}
