import Model from '@ember-data/model';
import { belongsTo } from '@ember-data/model';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import ENV from '../config/environment';
import type Store from '@ember-data/store';
import type TrackModel from './track';
import type RequestCacheService from 'euclip/services/request-cache';

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
  @service declare requestCache: RequestCacheService;

  @belongsTo('track', { async: false, inverse: 'audioFileTree' })
  declare track: TrackModel;

  @tracked directoryTree: DirectoryModel[] = [];

  /**
   * Checks if a directory contains audio files or subdirectories.
   * Used by Multiple component to decide whether to expand or create tracks.
   */
  static async checkDirectoryContents(
    path: string,
    requestCache?: RequestCacheService
  ): Promise<{ hasAudio: boolean; hasSubdirs: boolean; response: DirectoryResponse }> {
    const response = await AudioFileTreeModel.fetchDirectory(path, {}, requestCache);
    
    return {
      hasAudio: response.audio && response.audio.length > 0,
      hasSubdirs: response.dirs && response.dirs.length > 0,
      response
    };
  }

  /**
   * Appends new directory data to the current tree based on a given path.
   * This clears any previously selected audio directories, fetches the tree from the server,
   * and appends the updated tree.
   * 
   * @param path - The directory path to fetch
   * @param options - Additional options for conditional behavior
   * @param options.onlyIfHasSubdirs - If true, only append if the directory has subdirectories
   */
  async appendDirectoriesData(
    path: string | null,
    options: { onlyIfHasSubdirs?: boolean } = {}
  ): Promise<void> {
    // Retain only directory-type nodes
    this.directoryTree = this.directoryTree.filter((dir) => dir.type === 'dir');
    
    try {
      const safePath = path || '/';
      const { hasSubdirs, response } = await AudioFileTreeModel.checkDirectoryContents(safePath, this.requestCache);
      
      // If onlyIfHasSubdirs is true and directory has no subdirs, don't append
      if (options.onlyIfHasSubdirs && !hasSubdirs) {
        return;
      }

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

  static createRecord(store: Store, params: any, path = '') {
    const audioFileTree = store.createRecord('audio-file-tree', params);
    let pathArr = path.split('/');
    const item = pathArr.pop();
    audioFileTree.appendDirectoriesData(pathArr.join('/'));
    return audioFileTree;
  }

  /**
   * Fetches a directory listing from the API based on the given path and optional search/page params.
   * Uses the request cache service to avoid duplicate requests.
   */
  static async fetchDirectory(
    path: string,
    { search, page }: FetchDirectoryOptions,
    requestCache?: RequestCacheService
  ): Promise<DirectoryResponse> {
    const encodedPath = path
      ? path.split('/').map(encodeURIComponent).join('/')
      : '';

    const searchQuery = search ? `/search?q=${search}&page=${page}` : '';
    const url = `${ENV.APP['API_PREFIX']}/files${encodedPath}${searchQuery}`;
    
    if (requestCache) {
      // Create cache key using the service helper
      const cacheKey = requestCache.createCacheKey(path, { search, page });
      console.log('Checking cache for key:', cacheKey, 'on service:', requestCache.serviceId);
      requestCache.debugCache();
      
      if (requestCache.hasItem(cacheKey)) {
        console.log('✅ Cache hit for:', cacheKey);
        return requestCache.getItem(cacheKey);
      }
      
      // Check if there's already a pending request for this key
      if (requestCache.hasPendingRequest(cacheKey)) {
        console.log('🔄 Request already in progress for:', cacheKey);
        const pendingRequest = requestCache.getPendingRequest<DirectoryResponse>(cacheKey);
        if (pendingRequest) {
          return pendingRequest;
        }
      }
      
      console.log('Cache miss for:', cacheKey, 'making request to:', url);
    }

    // Create the request promise
    const requestPromise = fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch directory: ${response.statusText}`);
      }
      return response.json();
    });

    // Store the pending request if cache is available
    if (requestCache) {
      const cacheKey = requestCache.createCacheKey(path, { search, page });
      requestCache.setPendingRequest(cacheKey, requestPromise);
    }

    try {
      const data = await requestPromise;
      
      // Cache the response if service is available
      if (requestCache) {
        const cacheKey = requestCache.createCacheKey(path, { search, page });
        console.log('Caching response for key:', cacheKey, 'on service:', requestCache.serviceId);
        requestCache.setItem(cacheKey, data);
        console.log('Cache size after set:', requestCache.cacheSize);
      }
      
      return data;
    } catch (error) {
      // Remove the pending request on error
      if (requestCache) {
        const cacheKey = requestCache.createCacheKey(path, { search, page });
        requestCache.pendingRequests.delete(cacheKey);
      }
      throw error;
    }
  }

  /**
   * Clears the entire cache - useful for testing or when you need fresh data
   */
  static clearCache(requestCache: RequestCacheService): void {
    requestCache.clearCache();
  }

  /**
   * Debug method to inspect cache state
   */
  static debugCache(requestCache: RequestCacheService): void {
    requestCache.debugCache();
  }
}
