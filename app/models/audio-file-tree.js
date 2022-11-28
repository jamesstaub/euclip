import Model from '@ember-data/model';
import { belongsTo } from '@ember-data/model';
import { tracked } from '@glimmer/tracking';
import ENV from '../config/environment';

class Directory {
  @tracked currentSelection;
  @tracked path;
  @tracked choices;

  constructor(attrs) {
    // Drumserver API attributes
    this.dirs = attrs.dirs; // `dirs` are items in a Directory which link to new Directories
    this.audio = attrs.audio;
    this.path = attrs.path; // the "endpoint" of the path depending on the depth of this directory. aka the path up to this point
    this.currentSelection = attrs.currentSelection;
    // computed properties for UI:
    this.type = this.audio.length ? 'audio' : 'dir'; // prefer type as audio if a directory contains both
    this.choices = this.audio.length ? this.audio : this.dirs;
  }

  onSelectItem(item) {
    this.currentSelection = item;
    // once an audio file has been selected, the filename saved on the tracknode
    // will propegate down to the audio-file-tree
  }

  get selectedPath() {
    return `${this.path}${this.currentSelection}`.replace('//', '/'); // hack to deal with API parsing issue;
  }

  get currentDirIdx() {
    return this.choices.indexOf(this.currentSelection) || 0;
  }
}

/**
 * State related to searching for audio files from the Drum File Picker
 * on a given Track
 */
export default class AudioFileTreeModel extends Model {
  @belongsTo('track') track;
  @tracked directoryTree = [];

  async loadDirectories() {
    const path = this.filePathFromTrack.split('/');
    path.pop();
    this.directories = await this.fetchDirectoriesData(path.join('/'));
  }

  get filePathFromTrack() {
    // the track's source node contains the saved state of a selected audio file
    // the directories UI parses it to load the relevant file tree for the track node
    return this.track.get('samplerFilepathControl.controlStringValue') || '';
  }

  get pathToFetch() {
    return this.selectedPath || this.filePathFromTrack;
  }

  async fetchDirectoriesData(path) {
    this.directoryTree = [];
    try {
      const response = await AudioFileTreeModel.fetchDirectory(path);
      response.ancestor_tree?.forEach((tree) =>
        this.directoryTree.push(new Directory(tree))
      );
    } catch (error) {
      console.error('Error fetching audio directories:', error);
    }

    // clear any child directories when clicking back higher up the tree
    // if (_directories.value.path) {
    //   const pathDepth = _directories.value.path.split('/').filter((s) => s.length).length;
    //   while (_directories.value.length > pathDepth) {
    //     _directories.value.pop();
    //   }
    //   _directories.value.pushObject(_directories);
    // }
  }

  // async updateDirectories(pathToFetch) {
  //   let response = await AudioFileTreeModel.fetchDirectory.perform(pathToFetch);
  //   let directory = this.parseResponse(response);
  //   // clear any child directories when clicking back higher up the tree
  //   const pathDepth = directory.path.split('/').filter((s) => s.length).length;
  //   while (this.directories.length > pathDepth) {
  //     this.directories.pop();
  //   }
  //   this.directories.pushObject(directory);
  // }

  static async fetchDirectory(path) {
    const url = `${ENV.APP.DRUMSERVER_HOST}${path}`;
    const response = await fetch(url);
    const json = await response.json();
    return json;
  }
}
