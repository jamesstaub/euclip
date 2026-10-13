import Component from '@glimmer/component';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import type TrackModel from 'euclip/models/track';
import type AudioFileTreeModel from 'euclip/models/audio-file-tree';
import type { DirectoryModel } from 'euclip/models/audio-file-tree';
import type { AudioSelectMode } from 'euclip/components/project/ui-state';
import type SamplePoolService from 'euclip/services/sample-pool';
import type NotificationsService from 'euclip/services/notifications';
import ProjectModel from 'euclip/models/project';
import { TrackState } from 'euclip/models/track';
import { assignSound, clearSound, nextEmptySampler, samplerSlots, soundName } from 'euclip/utils/sampler-files';

export const buildPath = (dirPath: string, item: string) =>
  dirPath.endsWith('/') ? `${dirPath}${item}` : `${dirPath}/${item}`;

/** a kit has four samplers (see the Multi-sample kit track type) */
const KIT_SIZE = 4;

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
    /** makes one kit track with a sampler for each path; resolves with the track */
    onCreateKit?: (paths: string[]) => Promise<TrackModel | undefined>;
  };
}

interface SelectedAudioFile {
  filepath: string;
  filename: string;
  isSelected: boolean;
}

/**
 * The "Sounds" browser. What it is doing is set by its *target* (shown in the target card): a sampler of the active
 * track, or "new tracks". Browsing plays sounds; "Use" puts the sound at the target (and moves the target on to the
 * next empty sampler), or, when the target is new tracks, adds it to the selection.
 */
export default class FilePickerDrumFileSidebarComponent extends Component<FilePickerDrumFileSidebarSignature> {
  @service declare samplePool: SamplePoolService;
  @service declare notifications: NotificationsService;

  // The source node being edited: the same selection as the source menu's node tabs (the project UI state
  // holds it), so both always show which node of which track a picked file goes to.
  get targetNodeIdx(): number {
    const count = this.args.activeTrack?.sourceNodeRecords.length ?? 0;
    return Math.min(this.args.selectedSourceIdx ?? 0, Math.max(0, count - 1));
  }
  @tracked selectedFiles: SelectedAudioFile[] = [];
  @tracked isCreating = false;

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

  // the folder being shown: the deepest one of the tree (the ones before it are its ancestors)
  get currentDirectory(): DirectoryModel | undefined {
    const tree = this.audioFileTreeForMode?.directoryTree ?? [];
    return tree[tree.length - 1];
  }

  get isCurrentTrackMode() {
    return this.args.audioSelectMode === 'current_track';
  }

  get isCreateTracksMode() {
    return this.args.audioSelectMode === 'create_tracks';
  }

  // "In this project" (the sample pool) is a shelf of its own; creating tracks is only about the catalog
  get showPool(): boolean {
    return this.args.tab === 'pool' && this.isCurrentTrackMode;
  }

  get segments() {
    return [
      { label: 'In this project', value: 'pool', count: this.args.project?.projectSamples?.length ?? 0, showCount: true },
      { label: 'All sounds', value: 'browse' },
    ];
  }

  get segment(): string {
    return this.showPool ? 'pool' : 'browse';
  }

  get title(): string {
    return 'Sounds';
  }

  // where each sound already lives on the target track: path -> "Sampler 2"
  get badges(): Record<string, string> {
    if (this.isCreateTracksMode) return {};
    const slots = samplerSlots(this.args.activeTrack);
    const kit = slots.length > 1;
    const badges: Record<string, string> = {};
    for (const slot of slots) {
      if (slot.path) badges[slot.path] = kit ? `Sampler ${slot.number}` : 'In use';
    }
    return badges;
  }

  // the sound the target sampler holds now
  get currentPath(): string | undefined {
    if (this.isCreateTracksMode) return undefined;
    const slots = samplerSlots(this.args.activeTrack);
    return (slots.find((slot) => slot.index === this.targetNodeIdx) ?? slots[0])?.path || undefined;
  }

  get selectedPaths(): string[] {
    return this.selectedFiles.map((file) => file.filepath);
  }

  // a kit has four samplers: make one from two to four sounds
  get kitDisabled(): boolean {
    return this.selectedFiles.length < 2 || this.selectedFiles.length > KIT_SIZE;
  }

  @action
  setSegment(value: 'pool' | 'browse') {
    this.args.setTab?.(value);
  }

  // ---- target -------------------------------------------------------------------------------------

  @action
  selectSampler(index: number) {
    this.args.setAudioSelectMode?.('current_track');
    this.args.setSelectedSourceIdx?.(index);
  }

  @action
  targetNewTracks() {
    this.args.setAudioSelectMode?.('create_tracks');
    this.args.setTab?.('browse');
  }

  // ---- browsing -----------------------------------------------------------------------------------

  @action
  async openFolder(directory: DirectoryModel, name: string) {
    await this.audioFileTreeForMode?.appendDirectoriesData(buildPath(directory.path, name));
  }

  // one folder up. The root has no parent.
  @action
  async goUp() {
    const directory = this.currentDirectory;
    if (!directory) return;
    const names = directory.path.split('/').filter(Boolean);
    if (!names.length) return;
    await this.audioFileTreeForMode?.appendDirectoriesData(`/${names.slice(0, -1).join('/')}`);
  }

  @action
  audition(path: string) {
    this.samplePool.previewPath(path);
  }

  // ---- using a sound ------------------------------------------------------------------------------

  /** "Use": a sound goes to the target sampler, or (creating tracks) joins the selection */
  @action
  async useSound(path: string) {
    if (this.isCreateTracksMode) {
      this.toggleFileSelection(path);
      return;
    }
    if (this.args.activeTrack) {
      await this.saveFilepathControl(path, this.args.activeTrack);
    }
  }

  @action
  async saveFilepathControl(filepath: string, track: TrackModel): Promise<void> {
    track.state = TrackState.SAVED;

    // the previous Undo is out of date the moment another pick starts (the new one has no toast yet,
    // and undoing the old one would empty the sampler that was just filled)
    this.notifications.dismissGroup('undo');

    try {
      // the selected sampler node decides the slot: the n-th sampler of the track gets the n-th file
      // a picked file only fits a sampler: the selected node when it is one, else the track's first sampler
      const sampler =
        this.selectedNode?.nodeType === 'sampler' ? this.selectedNode : track.samplerNodes[0];
      const slot = sampler?.orderOfType ?? 0;
      const hereIndex = this.targetNodeIdx;
      const previous = await assignSound(track, slot, filepath);
      track.state = TrackState.SETUP;
      this.afterAssign(track, slot, filepath, previous, hereIndex);
    } catch (error) {
      track.state = TrackState.ERROR;
      console.error('Error saving filepath control: ', error);
    }
  }

  // the target moves on to the next empty sampler, and a toast says what happened (with Undo)
  private afterAssign(track: TrackModel, slot: number, filepath: string, previous: string, hereIndex: number) {
    this.samplePool.refresh(this.args.project); // the pool gains the sound and shows who uses it
    const slots = samplerSlots(track);
    const kit = slots.length > 1;
    const next = nextEmptySampler(track, hereIndex);
    if (next) this.args.setSelectedSourceIdx?.(next.index);

    const name = soundName(filepath);
    const message = kit
      ? `Sampler ${slot + 1} ← ${name}${next ? `. Next: Sampler ${next.number}` : ''}`
      : `${name} is now track ${track.order}'s sound`;
    this.notifications.push({
      type: 'success',
      group: 'undo',
      message,
      actionLabel: 'Undo',
      timeout: 6000,
      action: () => {
        const restore = previous ? assignSound(track, slot, previous) : clearSound(track, slot);
        Promise.resolve(restore).then(() => {
          this.samplePool.refresh(this.args.project);
          const here = slots.find((item) => item.slot === slot);
          if (here) this.args.setSelectedSourceIdx?.(here.index);
        });
      },
    });
  }

  @action
  async onSelectFileFromSearch(filepath: string): Promise<void> {
    if (this.isCreateTracksMode) {
      this.toggleFileSelection(filepath);
    } else if (this.args.activeTrack) {
      return this.saveFilepathControl(filepath, this.args.activeTrack);
    }
  }

  // ---- creating tracks ----------------------------------------------------------------------------

  @action
  async onTracksCreated(tracks: TrackModel[]): Promise<void> {
    if (this.args.onTracksCreated) {
      this.args.onTracksCreated(tracks);
    }
  }

  @action
  toggleFileSelection(filepath: string) {
    const existingFile = this.selectedFiles.find((f) => f.filepath === filepath);

    if (existingFile) {
      this.selectedFiles = this.selectedFiles.filter((f) => f.filepath !== filepath);
    } else {
      this.selectedFiles = [
        ...this.selectedFiles,
        { filepath, filename: soundName(filepath) || filepath, isSelected: true },
      ];
    }
  }

  @action
  clearSelection() {
    this.selectedFiles = [];
  }

  // one track for each selected sound
  @action
  async submitSelectedFiles() {
    if (!this.selectedFiles.length || !this.isCreateTracksMode || this.isCreating) return;
    this.isCreating = true;

    const trackConfigs = this.selectedFiles.map((file, index) => ({
      attributes: { hits: 0, steps: 8 },
      filepath: file.filepath,
      trackNumber: this.getNextAvailableTrackNumber() + index,
    }));

    try {
      const tracks = await ProjectModel.createMultipleTracksInBulk(this.args.project, trackConfigs);
      this.args.onTracksCreated?.(tracks);
      this.selectedFiles = [];
      this.args.onCloseSidebar?.();
    } catch (error) {
      console.error('Error creating tracks from selected files:', error);
    } finally {
      this.isCreating = false;
    }
  }

  // one kit track with a sampler for each selected sound
  @action
  async createKit() {
    if (this.kitDisabled || this.isCreating || !this.args.onCreateKit) return;
    this.isCreating = true;
    try {
      await this.args.onCreateKit(this.selectedFiles.map((file) => file.filepath));
      this.selectedFiles = [];
      this.args.onCloseSidebar?.();
    } catch (error) {
      console.error('Error creating a kit from selected files:', error);
    } finally {
      this.isCreating = false;
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

  // "/" jumps to the search box, as in most file browsers
  @action
  onKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
      const search = (event.currentTarget as HTMLElement).querySelector<HTMLInputElement>('[data-test-sound-search]');
      if (search) {
        event.preventDefault();
        search.focus();
      }
    }
  }
}
