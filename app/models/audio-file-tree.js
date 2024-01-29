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

  get currentDirIdx() {
    let currentIdx = this.choices.indexOf(this.currentSelection);
    // default to first item if not postion set yet
    if (currentIdx === -1) {
      currentIdx = 0;
    }
    return currentIdx;
  }
}

/**
 * State related to searching for audio files from the Drum File Picker
 * on a given Track
 */
export default class AudioFileTreeModel extends Model {
  @belongsTo('track', { async: false, inverse: 'audioFileTreeModel' }) track;
  @tracked directoryTree = [];

  // TODO:
  // maybe implement as separate methods for onSelectItem and track.createAudioFileTree
  // latter needs to call pop() maybe to clear the Sounds list

  async appendDirectoriesData(path, item) {
    this.directoryTree = this.directoryTree.filter((dir) => dir.type == 'dir');
    try {
      path = path || '/';
      const response = await AudioFileTreeModel.fetchDirectory(path, {});
      if (response.ancestor_tree?.length) {
        response.ancestor_tree.pop(); // remove the current directory since it's added below
        this.directoryTree = [
          ...response.ancestor_tree.map((tree) => new Directory(tree)),
        ];
      }

      this.directoryTree = [
        ...this.directoryTree,
        new Directory({ currentSelection: item, ...response }),
      ];
    } catch (error) {
      console.error('Error fetching directories:', error);
    }
  }

  static async fetchDirectory(path, { search, page }) {
    const encodedPath = path
      ? path.split('/').map(encodeURIComponent).join('/')
      : '';

    const searchQuery = search ? `/search?q=${search}&page=${page}` : '';

    const url = `/v1/files${encodedPath}${searchQuery}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return await response.json();
  }
}
