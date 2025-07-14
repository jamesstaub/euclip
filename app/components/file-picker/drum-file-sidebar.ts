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
import { playAudioFile } from 'euclip/utils/cracked';

interface FilePickerDrumFileSidebarSignature {
  Args: {
    activeTrack: TrackModel;
    audioFileTree?: AudioFileTreeModel;
    createFromDirectory?: boolean;
    audioSelectMode?: AudioSelectMode;
    setAudioSelectMode?: (mode: AudioSelectMode) => void;
    onCloseSidebar?: () => void;
  };
}

export default class FilePickerDrumFileSidebarComponent extends Component<FilePickerDrumFileSidebarSignature> {
  @service declare store: StoreService;

  @tracked targetNodeIdx = 0;

  @tracked isDownloading = false;

  get selectedNode() {
    return this.args.activeTrack.samplerNodes[this.targetNodeIdx];
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
    const fileTree = await this.args.activeTrack.audioFileTree;

    if (directory.type === 'dir') {
      // Construct the full path by appending the selected item to the current directory path
      const selection = directory.path.endsWith('/')
        ? `${directory.path}${item}`
        : `${directory.path}/${item}`;

      console.log('Calling appendDirectoriesData with selection:', selection);
      await fileTree.appendDirectoriesData(selection);
    } else if (directory.type === 'audio') {
      const selection = directory.path.endsWith('/')
        ? `${directory.path}${item}`
        : `${directory.path}/${item}`;
      return this.saveFilepathControl(selection);
    }
  }

  @action
  async saveFilepathControl(filepath: string): Promise<void> {
    await this.downloadFile(filepath);
    let filepathControl = FilepathControlModel.findOrCreateWith({
      track: this.args.activeTrack,
      trackNode: this.selectedNode,
      controlValue: filepath,
    });
    try {
      await filepathControl.save();
    } catch (error) {
      console.error('Error saving filepath control: ', error);
    }

    this.args.activeTrack.setupAudioFromScripts();
  }
}
