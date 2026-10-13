import Component from '@glimmer/component';
import SoundFileModel from 'euclip/models/sound-file';
import { service } from '@ember/service';
import type StoreService from '@ember-data/store';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import type TrackModel from 'euclip/models/track';
import type AudioFileTreeModel from 'euclip/models/audio-file-tree';
import type { DirectoryModel } from 'euclip/models/audio-file-tree';
import type { AudioSelectMode } from 'euclip/components/project/ui-state';
import ProjectModel from 'euclip/models/project';
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
    tab?: 'pool' | 'browse';
    setTab?: (tab: 'pool' | 'browse') => void;
    selectedSourceIdx?: number;
    setSelectedSourceIdx?: (idx: number) => void;
    onCloseSidebar?: () => void;
    onTracksCreated?: (tracks: TrackModel[]) => void;
  };
}

interface SelectedAudioFile {
  filepath: string;
  filename: string;
  isSelected: boolean;
}

export default class FilePickerDrumFileSidebarComponent extends Component<FilePickerDrumFileSidebarSignature> {
  @service declare store: StoreService;

  // The source node being edited: the same selection as the source menu's node tabs (the project UI state
  // holds it), so both always show which node of which track a picked file goes to.
  get targetNodeIdx(): number {
    const count = this.args.activeTrack?.sourceNodeRecords.length ?? 0;
    return Math.min(this.args.selectedSourceIdx ?? 0, Math.max(0, count - 1));
  }
  @tracked isDownloading = false;
  @tracked selectedFiles: SelectedAudioFile[] = [];

  get selectedNode() {
    // Only available in 'current_track' mode when we have an active track
    if (
      this.args.audioSelectMode === 'current_track' &&
      this.args.activeTrack
    ) {
      return this.args.activeTrack.sourceNodeRecords[this.targetNodeIdx];
    }
    return null;
  }

  get audioFileTreeForMode() {
    if (this.args.audioSelectMode === 'create_tracks') {
      return this.args.defaultAudioFileTree;
    } else if (
      this.args.audioSelectMode === 'current_track' &&
      this.args.activeTrack
    ) {
      return this.args.activeTrack.audioFileTree;
    }
    return null;
  }

  // the sample pool is a tab of its own; creating tracks from files is only about the catalog
  get showPool(): boolean {
    return this.args.tab === 'pool' && this.isCurrentTrackMode;
  }

  get tabs() {
    return [
      { label: 'Sample Pool', value: 'pool', order: 0 },
      { label: 'Browse', value: 'browse', order: 1 },
    ];
  }

  get title(): string {
    if (!this.isCurrentTrackMode) return 'Create Tracks From Selection';
    return this.showPool ? 'Sample Pool' : `Select Sampler For Track ${this.args.activeTrack?.order ?? ''}`;
  }

  get isCurrentTrackMode() {
    return this.args.audioSelectMode === 'current_track';
  }

  get isCreateTracksMode() {
    return this.args.audioSelectMode === 'create_tracks';
  }

  async downloadFile(filepath: string): Promise<SoundFileModel> {
    this.isDownloading = true;
    const soundFile = await SoundFileModel.findOrDownload(filepath, this.store);
    this.isDownloading = false;
    return soundFile;
  }

  @action
  selectTargetSlot(idx: number) {
    this.args.setSelectedSourceIdx?.(idx);
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
    } else if (
      directory.type === 'audio' &&
      this.isCurrentTrackMode &&
      this.args.activeTrack
    ) {
      return this.saveFilepathControl(selection, this.args.activeTrack);
    }
  }

  @action
  async saveFilepathControl(
    filepath: string,
    track: TrackModel
  ): Promise<void> {
    track.state = TrackState.SAVED;

    try {
      // the selected sampler node decides the slot: the n-th sampler of the track gets the n-th file
      // a picked file only fits a sampler: the selected node when it is one, else the track's first sampler
      const sampler =
        this.selectedNode?.nodeType === 'sampler' ? this.selectedNode : track.samplerNodes[0];
      const slot = sampler?.orderOfType ?? 0;
      await track.setFile(slot, filepath);
      track.state = TrackState.SETUP;
      this.advanceTarget(track);
    } catch (error) {
      track.state = TrackState.ERROR;
      console.error('Error saving filepath control: ', error);
    }
  }

  /**
   * After a sound lands in a sampler, the next empty sampler of the track becomes the target, so filling a
   * kit is one pick after another. Stays put when every sampler has a sound.
   */
  private advanceTarget(track: TrackModel) {
    const filled = new Set(
      track.sortedFilepathControls.filter((control) => control.controlValue).map((control) => control.nodeOrder)
    );
    const empty = track.sourceNodeRecords
      .map((node, index) => ({ node, index }))
      .filter(({ node }) => node.nodeType === 'sampler' && !filled.has(node.orderOfType));
    if (!empty.length) return;
    const next = empty.find(({ index }) => index > this.targetNodeIdx) ?? empty[0];
    this.args.setSelectedSourceIdx?.(next.index);
  }

  @action
  async onSelectFileFromSearch(filepath: string): Promise<void> {
    if (this.args.activeTrack) {
      return this.saveFilepathControl(filepath, this.args.activeTrack);
    }
  }

  @action
  async onTracksCreated(tracks: TrackModel[]): Promise<void> {
    if (this.args.onTracksCreated) {
      this.args.onTracksCreated(tracks);
    }
  }

  @action
  toggleFileSelection(filepath: string) {
    const existingFile = this.selectedFiles.find(
      (f) => f.filepath === filepath
    );

    if (existingFile) {
      // File is already selected, remove it
      this.selectedFiles = this.selectedFiles.filter(
        (f) => f.filepath !== filepath
      );
    } else {
      // File is not selected, add it (unlimited selections allowed)
      const filename = filepath.split('/').pop() || filepath;
      const newFile: SelectedAudioFile = {
        filepath,
        filename,
        isSelected: true,
      };
      this.selectedFiles = [...this.selectedFiles, newFile];
    }
  }

  @action
  async submitSelectedFiles() {
    if (this.selectedFiles.length === 0) {
      return;
    }

    // This method is now only called in "create_tracks" mode
    // since "current_track" mode uses direct click behavior
    if (this.isCreateTracksMode) {
      // In create tracks mode, create tracks for all selected files
      const trackConfigs = this.selectedFiles.map((file, index) => ({
        attributes: { hits: 0, steps: 8 },
        filepath: file.filepath,
        trackNumber: this.getNextAvailableTrackNumber() + index,
      }));

      try {
        const tracks = await ProjectModel.createMultipleTracksInBulk(
          this.args.project,
          trackConfigs
        );

        if (this.args.onTracksCreated) {
          this.args.onTracksCreated(tracks);
        }

        if (this.args.onCloseSidebar) {
          this.args.onCloseSidebar();
        }

        // Clear selections after creating tracks
        this.selectedFiles = [];
      } catch (error) {
        console.error('Error creating tracks from selected files:', error);
      }
    }
  }

  getNextAvailableTrackNumber(): number {
    const existingTracks = this.args.project.orderedTracks;
    const maxTrackNumber =
      existingTracks.length > 0
        ? Math.max(...existingTracks.map((t) => t.order))
        : 0;
    return maxTrackNumber + 1;
  }
}
