import Component from '@glimmer/component';
import { action } from '@ember/object';

import { inject as service } from '@ember/service';

import { typeOf } from '@ember/utils';
import AudioFileTreeModel from '../models/audio-file-tree';
import { tracked } from '@glimmer/tracking';
import { restartableTask, timeout } from 'ember-concurrency';
import SoundFileModel from '../models/sound-file';

export default class DrumFilePicker extends Component {
  @service store;
  @tracked searchResults;

  @restartableTask
  *searchTask() {
    let pageToSearch = 0;
    // this sucks but when this method is called by the pagination buttons, second arg is the page
    // when called in search, second arg is the DOM event
    if (typeOf(arguments[1]) === 'number') {
      pageToSearch = arguments[1];
    }
    yield timeout(200);
    if (this.searchQuery.length > 2) {
      const results = yield AudioFileTreeModel.fetchDirectory(null, {
        search: this.searchQuery,
        page: pageToSearch,
      });

      this.searchResults = results.results;
      this.currentPage = results.page;
      // this.lastPage = results.last_page;
    }
  }

  async saveFilepathControl(filepath) {
    await SoundFileModel.findOrDownload(filepath, this.store);

    const track = await this.args.track;
    // TODO find a betterplace to createDefaultFilepathControl if it doersn' exist
    const filepathControl = track.get('samplerFilepathControl');
    if (!filepathControl) {
      console.error(
        'Tried to save a file but no TrackControl exists for filepath'
      );
    }

    filepathControl.set('controlStringValue', filepath);
    track.setupAudioFromScripts();
    filepathControl.save();
  }

  @action
  search() {
    this.searchTask.perform();
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
  async onSelectSearchResult(searchResult) {
    const directoryItems = searchResult.split('/');
    const item = directoryItems.pop();
    const ancestorPath = `${directoryItems.join('/')}/`;
    const fileTree = await this.args.audioFileTreeModel;
    fileTree.appendDirectoriesData(ancestorPath, item);
    this.saveFilepathControl(searchResult);
  }
}
