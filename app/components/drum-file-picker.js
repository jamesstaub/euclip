import Component from '@glimmer/component';
import { action } from '@ember/object';

import { service } from '@ember/service';

import { typeOf } from '@ember/utils';
import AudioFileTreeModel from '../models/audio-file-tree';
import { tracked } from '@glimmer/tracking';
import { restartableTask, timeout } from 'ember-concurrency';
import SoundFileModel from '../models/sound-file';
import FilepathControlModel from '../models/filepath-control';

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

    // Ensure filepathControls is an array and handle proxies
    const filepathControls = Array.isArray(track.filepathControls)
      ? track.filepathControls
      : [];

    // Check if a filepathControl already exists for the track
    let filepathControl = filepathControls.find(
      (control) => control.trackNode === track.samplerNodes[0]
    );

    if (filepathControl) {
      // Update the existing filepathControl
      filepathControl.controlValue = filepath;
    } else {
      // Create a new filepathControl if none exists
      filepathControl = FilepathControlModel.findOrCreateWith({
        track,
        trackNode: track.samplerNodes[0],
        controlValue: filepath,
      });
    }

    try {
      await filepathControl.save();
    } catch (error) {
      console.error('Error saving filepath control: ', error);
    }

    track.setupAudioFromScripts();
  }

  @action
  search() {
    this.searchTask.perform();
  }

  @action
  async onSelectItem(directory, item) {
    const fileTree = await this.args.audioFileTree;
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
    console.log('item')
    const ancestorPath = `${directoryItems.join('/')}/`;
    const fileTree = await this.args.audioFileTree;
    console.log('fileTree', fileTree);  
    fileTree.appendDirectoriesData(ancestorPath, item);
    
    this.saveFilepathControl(searchResult);
  }
}
