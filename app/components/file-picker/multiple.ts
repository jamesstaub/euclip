import type StoreService from '@ember-data/store';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import type Owner from '@ember/owner';
import AudioFileTreeModel, { DirectoryModel } from 'euclip/models/audio-file-tree';
import { action } from '@ember/object';
import { buildPath } from './drum-file-sidebar';
import ProjectModel from 'euclip/models/project';
import type TrackModel from 'euclip/models/track';
import type RequestCacheService from 'euclip/services/request-cache';

type Args = {
  audioFileTree: AudioFileTreeModel;
  project: ProjectModel;
  onTracksCreated?: (tracks: TrackModel[]) => void;
}

export default class FilePickerMultipleComponent extends Component<Args> {
  @service declare requestCache: RequestCacheService;

  @action
  async onSelectItem(directory: DirectoryModel, item: string) {
    const selection = buildPath(directory.path, item);
    
    // Check what the selected directory contains
    const { hasAudio, hasSubdirs, response } = await AudioFileTreeModel.checkDirectoryContents(selection, this.requestCache);
    
    if (hasSubdirs) {
      // Directory has subdirectories, expand the tree
      await this.args.audioFileTree.appendDirectoriesData(selection, { onlyIfHasSubdirs: true });
    } else if (hasAudio) {
      // Directory has audio files, create multiple tracks from the fetched response
      const trackConfigs = response.audio.map((audioFile) => ({
        attributes: { hits: 0, steps: 8 },
        filepath: buildPath(response.path, audioFile)
      }));
      
      try {
        const tracks = await ProjectModel.createMultipleTracksInBulk(this.args.project, trackConfigs);
        
        if (this.args.onTracksCreated) {
          this.args.onTracksCreated(tracks);
        }
      } catch (error) {
        console.error('Error creating multiple tracks:', error);
      }
    }
  }
}
