import Model from '@ember-data/model';
import { belongsTo } from '@ember-data/model';
import { tracked } from '@glimmer/tracking';
import ENV from '../config/environment';
import type TrackModel from './track';

type DirectoryAttrs = {
  dirs: string[]; // or more specific object shape if known
  audio: string[]; // same as above
  path: string;
  currentSelection?: string; // or object depending on what's selected
};

export class DirectoryModel {
  dirs: string[];
  audio: string[];

  @tracked currentSelection: string | undefined;
  @tracked path: string;
  @tracked choices: string[];

  type: 'audio' | 'dir';

  constructor(attrs: DirectoryAttrs) {
    this.dirs = attrs.dirs;
    this.audio = attrs.audio;
    this.path = attrs.path;
    this.currentSelection = attrs.currentSelection;

    this.type = this.audio.length ? 'audio' : 'dir';
    this.choices = this.audio.length ? this.audio : this.dirs;
  }

  onSelectItem(item: string): void {
    this.currentSelection = item;
  }

  get currentDirIdx(): number {
    const idx = this.choices.indexOf(this.currentSelection ?? '');
    return idx !== -1 ? idx : 0;
  }
}

/**
 * State related to searching for audio files from the Drum File Picker
 * on a given Track
 */
interface FetchDirectoryOptions {
  search?: string;
  page?: number;
}

interface DirectoryResponse {
  ancestor_tree?: any[];
  dirs: string[];
  audio: string[];
  path: string;
}
export default class AudioFileTreeModel extends Model {
  @belongsTo('track', { async: false, inverse: 'audioFileTree' })
  declare track: TrackModel;

  @tracked directoryTree: DirectoryModel[] = [];

  /**
   * Appends new directory data to the current tree based on a given path.
   * This clears any previously selected audio directories, fetches the tree from the server,
   * and appends the updated tree.
   */
  async appendDirectoriesData(
    path: string | null
  ): Promise<void> {
    // Retain only directory-type nodes
    this.directoryTree = this.directoryTree.filter((dir) => dir.type === 'dir');
    try {
      const safePath = path || '/';
      const response: DirectoryResponse =
        await AudioFileTreeModel.fetchDirectory(safePath, {});

      if (response.ancestor_tree?.length) {
        response.ancestor_tree.pop(); // drop the current directory
        this.directoryTree = [
          ...response.ancestor_tree.map((tree) => new DirectoryModel(tree)),
        ];
      }

      // Extract the selected item from the path for currentSelection
      const pathSegments = safePath.split('/').filter(segment => segment.length > 0);
      const selectedItem = pathSegments[pathSegments.length - 1] || '';

      this.directoryTree = [
        ...this.directoryTree,
        new DirectoryModel({ currentSelection: selectedItem, ...response }),
      ];
    } catch (error) {
      console.error('Error fetching directories:', error);
    }
  }

  /**
   * Fetches a directory listing from the API based on the given path and optional search/page params.
   */
  static async fetchDirectory(
    path: string,
    { search, page }: FetchDirectoryOptions
  ): Promise<DirectoryResponse> {
    const encodedPath = path
      ? path.split('/').map(encodeURIComponent).join('/')
      : '';

    const searchQuery = search ? `/search?q=${search}&page=${page}` : '';

    const url = `${ENV.APP['API_PREFIX']}/files${encodedPath}${searchQuery}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch directory: ${response.statusText}`);
    }

    return await response.json();
  }
}
