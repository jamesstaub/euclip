import Component from '@ember/component';
import { set, action } from '@ember/object';
import { bool } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import ENV from '../config/environment';
import { task } from 'ember-concurrency';
import { typeOf } from '@ember/utils';

export default Component.extend({
  store: service(),

  showSearchResults: bool('searchResults.length'),

  init() {
    this._super(...arguments);
    set(this, 'directories', []);
  },

  didReceiveAttrs() {
    this._super(...arguments);
    let path = '';
    if (this.track && this.track.filepath) {
      this.initDirectoryFromTrack.perform(this.track.filepath);
    } else {
      this.updateDirectories.perform(path);
    }
  },

  fetchDirectory: task(function* (path) {
    const url = `${ENV.APP.DRUMSERVER_HOST}${path}`;
    const response = yield fetch(url);
    const json = yield response.json();
    return json;
  }).evented(),

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
  },

  initDirectoryFromTrack: task(function* (filepath) {
    let path = filepath.split('/');
    path.pop();
    let response = yield this.fetchDirectory.perform(path.join('/'));
    if (response.ancestor_tree) {
      let directories = response.ancestor_tree.map(dir => {
        return this.parseResponse(dir);
      });
      set(this, 'directories', directories);
    }
  }),

  updateDirectories: task(function* (pathToFetch) {
    let response = yield this.fetchDirectory.perform(pathToFetch);
    let directory = this.parseResponse(response);
    // clear any child directories when clicking back higher up the tree
    const pathDepth = directory.path.split('/').filter(s => s.length).length;
    while (this.directories.length > pathDepth) {
      this.directories.pop();
    }
    this.directories.pushObject(directory);
  }).keepLatest(),
  
  search: action(async function() {
    let pageToSearch = 0;
    // this sucks but when this method is called by the pagination buttons, second arg is the page
    // when called in search, second arg is the DOM event
    if (typeOf(arguments[1]) === 'number') {
      pageToSearch = arguments[1];
    }

    const results = await this.fetchDirectory.perform(`/search/${this.searchQuery}?include_dir=${true}&page=${pageToSearch}`);
    this.set('searchResults', results.results);
    this.set('currentPage', results.page);
    this.set('lastPage', results.last_page);
  }),

  backToBrowse: action(async function() {
    this.set('searchResults', null);
    this.set('searchQuery', null);
  }),

  onSelect: action(function (directory, choice) {    
    set(directory, 'currentSelection', choice);
    let newPath = `${directory.path}${choice}`;
    let type = directory.type;
    newPath = newPath.replace('//', '/'); // hack to deal with API parsing issue
    if (type === 'dir') {
      this.updateDirectories.perform(newPath);
    } else if (type === 'audio') {
      this.updateTrackTask.perform('filepath', newPath);
    }
  }),

  onSelectSearchResult: action(function(result) {
    let directory = result.split('/')
    directory.pop();
    directory = `${directory.join('/')}/`;

    this.updateDirectories.perform(directory);
    this.updateTrackTask.perform('filepath', result);
  }),

});
