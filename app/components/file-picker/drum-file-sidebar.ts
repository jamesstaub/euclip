import Component from '@glimmer/component';
import SoundFileModel from 'euclip/models/sound-file';
import FilepathControlModel from 'euclip/models/filepath-control';
import { service } from '@ember/service';
import type StoreService from '@ember-data/store';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import type TrackModel from 'euclip/models/track';
import type AudioFileTreeModel from 'euclip/models/audio-file-tree';
import type { DirectoryModel } from 'euclip/models/audio-file-tree';
import type { AudioSelectMode } from 'euclip/components/project/ui-state';
import type ProjectModel from 'euclip/models/project';
import { TrackState } from 'euclip/models/track';
import { playAudioFile } from 'euclip/utils/cracked';

export const buildPath = (dirPath: string, item: string) =>
  dirPath.endsWith('/') ? `${dirPath}${item}` : `${dirPath}/${item}`;

interface FilePickerDrumFileSidebarSignature {
  Args: {
    activeTrack?: TrackModel; // Optional since it doesn't exist in 'dir' mode
    defaultAudioFileTree?: AudioFileTreeModel; // Used in 'dir' mode
    audioSelectMode: AudioSelectMode;
    project: ProjectModel;
    setAudioSelectMode?: (mode: AudioSelectMode) => void;
    onCloseSidebar?: () => void;
    onTracksCreated?: (tracks: TrackModel[]) => void;
  };
}

export default class FilePickerDrumFileSidebarComponent extends Component<FilePickerDrumFileSidebarSignature> {
  @service declare store: StoreService;

  @tracked targetNodeIdx = 0;
  @tracked isDownloading = false;

  get selectedNode() {
    // Only available in 'file' mode when we have an active track
    if (this.args.audioSelectMode === 'file' && this.args.activeTrack) {
      return this.args.activeTrack.samplerNodes[this.targetNodeIdx];
    }
    return null;
  }

  get audioFileTreeForMode() {
    if (this.args.audioSelectMode === 'dir') {
      return this.args.defaultAudioFileTree;
    } else if (this.args.audioSelectMode === 'file' && this.args.activeTrack) {
      return this.args.activeTrack.audioFileTree;
    }
    return null;
  }

  get isFileMode() {
    return this.args.audioSelectMode === 'file';
  }

  get isDirMode() {
    return this.args.audioSelectMode === 'dir';
  }

  async downloadFile(filepath: string): Promise<SoundFileModel> {
    this.isDownloading = true;
    const soundFile = await SoundFileModel.findOrDownload(filepath, this.store);
    this.isDownloading = false;
    return soundFile;
  }

  @action
  setUi(key: string, value: any) {
    // @ts-ignore
    this[key] = value;
  }

  @action
  async previewAudioFile(filepath: string) {
    const soundFile: SoundFileModel = await this.downloadFile(filepath);
    playAudioFile(soundFile.downloadedURI);
  }

  @action
  async onSelectItem(directory: DirectoryModel, item: string) {
    const fileTree = this.audioFileTreeForMode;
    if (!fileTree) {
      console.error('No audio file tree available for current mode');
      return;
    }

    const selection = buildPath(directory.path, item);

    if (directory.type === 'dir') {
      await fileTree.appendDirectoriesData(selection);
    } else if (directory.type === 'audio' && this.isFileMode && this.args.activeTrack) {
      return this.saveFilepathControl(selection, this.args.activeTrack);
    }
  }

  @action
  async saveFilepathControl(filepath: string, track: TrackModel): Promise<void> {
    track.state = TrackState.SAVED;
    
    await this.downloadFile(filepath);
    let filepathControl = FilepathControlModel.findOrCreateWith({
      track,
      trackNode: this.selectedNode,
      controlValue: filepath,
    });
    
    try {
      await filepathControl.save();
      track.state = TrackState.SETUP;
      track.setupAudioFromScripts();
    } catch (error) {
      track.state = TrackState.ERROR;
      console.error('Error saving filepath control: ', error);
    }
  }

  @action
  async onTracksCreated(tracks: TrackModel[]): Promise<void> {
    if (this.args.onTracksCreated) {
      this.args.onTracksCreated(tracks);
    }
  }
}
