import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { registerDestructor } from '@ember/destroyable';
import type ProjectUiService from 'euclip/services/project-ui';

type Args = {
  activeTrack?: any;
  project?: any;
};

export type AudioSelectMode = 'current_track' | 'create_tracks';
// the left sidebar has two tabs: the project's sample pool, and the file browser (search the catalog)
export type LeftTab = 'pool' | 'browse';

export interface ProjectUiStateProps {
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  poolOpen: boolean;
  leftTab: LeftTab;
  audioSelectMode: AudioSelectMode;
}

export interface ProjectUiStateActions {
  toggleSidebar(trackId: string, direction: 'left' | 'right'): void;
  closeSidebar(direction: 'left' | 'right'): void;
  setAudioSelectMode(mode: AudioSelectMode): void;
  togglePool(): void;
  setSelectedSourceIdx(idx: number, trackId?: string): void;
  setLeftTab(tab: LeftTab): void;
  openCreateFromDirectory(): void;
  closeCreateFromDirectory(): void;
}

export default class ProjectUiStateComponent extends Component<Args> {
  @service declare media: any;
  @service declare projectUi: ProjectUiService;

  @tracked leftSidebarOpen = false;
  @tracked rightSidebarOpen = false;
  @tracked leftTab: LeftTab = 'browse';
  // The source node (index into the active track's `sourceNodeRecords`) being edited. The source menu and
  // the file sidebar both show and set it, so they always agree on which node of which track is selected.
  @tracked private selection: { trackId?: string; idx: number } = { idx: 0 };
  @tracked audioSelectMode: AudioSelectMode = 'current_track';

  constructor(owner: any, args: Args) {
    super(owner, args);

    this.rightSidebarOpen = this.media.isDesktop;

    this.projectUi.current = this;
    registerDestructor(this, () => {
      if (this.projectUi.current === this) this.projectUi.current = null;
    });
  }

  get createFromDirectory() {
    return this.audioSelectMode === 'create_tracks';
  }

  get uiState() {
    return {
      leftSidebarOpen: this.leftSidebarOpen,
      rightSidebarOpen: this.rightSidebarOpen,
      poolOpen: this.poolOpen,
      leftTab: this.leftTab,
      setLeftTab: this.setLeftTab,
      selectedSourceIdx: this.selectedSourceIdx,
      setSelectedSourceIdx: this.setSelectedSourceIdx,
      audioSelectMode: this.audioSelectMode,
      createFromDirectory: this.createFromDirectory,
      toggleSidebar: this.toggleSidebar,
      closeSidebar: this.closeSidebar,
      setAudioSelectMode: this.setAudioSelectMode,
      togglePool: this.togglePool,
      openCreateFromDirectory: this.openCreateFromDirectory,
      closeCreateFromDirectory: this.closeCreateFromDirectory,
    };
  }

  @action
  toggleSidebar(trackId: string, direction: 'left' | 'right') {
    // Handle case where trackId might be undefined/null
    if (!trackId && this.args.activeTrack?.id) {
      trackId = this.args.activeTrack.id;
    }

    const shouldToggle =
      trackId === this.args.activeTrack?.id ||
      (direction === 'left' && !this.leftSidebarOpen) ||
      (direction === 'right' && !this.rightSidebarOpen);

    if (shouldToggle) {
      if (direction === 'left') {
        this.leftSidebarOpen = !this.leftSidebarOpen;
        if (this.leftSidebarOpen) this.leftTab = 'browse'; // the track's file button opens the file browser
        // If we're closing the left sidebar, also reset audioSelectMode
        if (!this.leftSidebarOpen) {
          this.audioSelectMode = 'current_track';
        }
      } else {
        this.rightSidebarOpen = !this.rightSidebarOpen;
      }
    }
  }

  /**
   * Open the file browser for the active track, jumping to `path`
   * (a directory path) when given.
   */
  @action
  async showFilePath(path?: string) {
    this.audioSelectMode = 'current_track';
    this.leftTab = 'browse';
    this.leftSidebarOpen = true;
    const tree = this.args.activeTrack?.audioFileTree;
    if (tree && path) {
      await tree.appendDirectoriesData(path);
    }
  }

  @action
  closeSidebar(direction: 'left' | 'right') {
    if (direction === 'left') {
      this.leftSidebarOpen = false;
      this.audioSelectMode = 'current_track';
    } else {
      this.rightSidebarOpen = false;
    }
  }

  @action
  setAudioSelectMode(mode: AudioSelectMode) {
    this.audioSelectMode = mode;
  }

  get selectedSourceIdx(): number {
    const { trackId, idx } = this.selection;
    return trackId === this.args.activeTrack?.id ? idx : 0; // another track: start from its first node
  }

  @action
  setSelectedSourceIdx(idx: number, trackId?: string) {
    this.selection = { trackId: trackId ?? this.args.activeTrack?.id, idx };
  }

  @action
  setLeftTab(tab: LeftTab) {
    this.leftTab = tab;
  }

  get poolOpen() {
    return this.leftSidebarOpen && this.leftTab === 'pool';
  }

  // the "Samples" button: the left sidebar on its pool tab (closes the sidebar when it is already there)
  @action
  togglePool() {
    if (this.poolOpen) {
      this.leftSidebarOpen = false;
    } else {
      this.leftTab = 'pool';
      this.audioSelectMode = 'current_track';
      this.leftSidebarOpen = true;
    }
  }

  @action
  openCreateFromDirectory() {
    this.audioSelectMode = 'create_tracks';
    this.leftTab = 'browse';
    this.leftSidebarOpen = true;
  }

  @action
  closeCreateFromDirectory() {
    this.audioSelectMode = 'current_track';
    this.leftSidebarOpen = false;
  }
}
