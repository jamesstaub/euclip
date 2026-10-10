import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { restartableTask, timeout } from 'ember-concurrency';
import type { Task } from 'ember-concurrency';

import { typeOf } from '@ember/utils';

import AudioFileTreeModel from 'euclip/models/audio-file-tree';
import type StoreService from '@ember-data/store';

interface SamplerNode {
  // Define properties as needed
}

interface TrackModel {
  samplerNodes: SamplerNode[];
  setupAudioFromScripts(): void;
}

interface DrumFilePickerArgs {
  track: TrackModel;
  onSelectFile(filepath: string): void;
  audioFileTree: {
    appendDirectoriesData(path: string, selectedItem?: string): void;
  };
}

export default class FilePickerSearchComponent extends Component<DrumFilePickerArgs> {
  @service declare store: StoreService;

  @tracked searchResults: any[] | null = null;
  @tracked searchQuery: string = '';
  @tracked currentPage: number = 0;


  @restartableTask
  *searchTask(_: Event | unknown, pageOverride?: number): Generator<Promise<unknown>, void, any> {
    let pageToSearch = 0;
    if (typeOf(arguments[1]) === 'number') {
      pageToSearch = arguments[1] as number;
    }

    yield timeout(200);

    if (this.searchQuery.length > 2) {
      const results = yield AudioFileTreeModel.fetchDirectory('', {
        search: this.searchQuery,
        page: pageToSearch,
      });

      this.searchResults = results.results;
      this.currentPage = results.page;
      yield timeout(200);
    }
  }


  @action
  search(): void {
    (this.searchTask as Task).perform();
  }


  @action
  backToBrowse(): void {
    this.searchResults = null;
    this.searchQuery = '';
  }

  @action
  async onSelectSearchResult(searchResult: string): Promise<void> {
    const directoryItems = searchResult.split('/');
    const item = directoryItems.pop();
    const ancestorPath = `${directoryItems.join('/')}/`;
    const fileTree = await this.args.audioFileTree;

    fileTree.appendDirectoriesData(ancestorPath, item);
    
    if (this.args.onSelectFile) {
      return this.args.onSelectFile(searchResult);
    }
  }
}
