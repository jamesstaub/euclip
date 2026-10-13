import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { restartableTask, timeout } from 'ember-concurrency';
import type { Task } from 'ember-concurrency';

import { typeOf } from '@ember/utils';

import AudioFileTreeModel from 'euclip/models/audio-file-tree';
import type SamplePoolService from 'euclip/services/sample-pool';
import { soundName } from 'euclip/utils/sampler-files';
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
  showCheck?: boolean;
  selectedPaths?: string[];
  badges?: Record<string, string>;
  audioFileTree: {
    appendDirectoriesData(path: string, selectedItem?: string): void;
  };
}

export default class FilePickerSearchComponent extends Component<DrumFilePickerArgs> {
  @service declare store: StoreService;
  @service declare samplePool: SamplePoolService;

  @tracked searchResults: any[] | null = null;
  @tracked searchQuery: string = '';
  @tracked currentPage: number = 0;
  @tracked private expanded: Record<string, boolean> = {};

  readonly previewLimit = 4;

  // the results as rows, grouped by the machine (folder) they live in; long groups show a few and can be opened
  get groups() {
    const picked = new Set(this.args.selectedPaths ?? []);
    return (this.searchResults ?? []).map((result: any) => {
      const open = Boolean(this.expanded[result.folder]);
      const files = result.files as Array<{ filename: string; path: string }>;
      return {
        folder: result.folder,
        total: files.length,
        canExpand: files.length > this.previewLimit,
        open,
        rows: (open ? files : files.slice(0, this.previewLimit)).map((file) => {
          const key = file.path.startsWith('/') ? file.path : `/${file.path}`;
          return {
            name: soundName(file.filename),
            path: file.path,
            badge: this.args.badges?.[file.path],
            checked: picked.has(file.path),
            playing: this.samplePool.playingPath === key,
            loading: this.samplePool.loadingPath === key,
          };
        }),
      };
    });
  }

  @action
  toggleExpanded(folder: string): void {
    this.expanded = { ...this.expanded, [folder]: !this.expanded[folder] };
  }

  @action
  audition(path: string): void {
    this.samplePool.previewPath(path);
  }


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
