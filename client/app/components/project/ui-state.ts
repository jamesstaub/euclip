import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

type Args = {
  activeTrack?: any;
  project?: any;
};

export type AudioSelectMode = 'current_track' | 'create_tracks';

export interface ProjectUiStateProps {
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  poolOpen: boolean;
  audioSelectMode: AudioSelectMode;
}

export interface ProjectUiStateActions {
  toggleSidebar(trackId: string, direction: 'left' | 'right'): void;
  closeSidebar(direction: 'left' | 'right'): void;
  setAudioSelectMode(mode: AudioSelectMode): void;
  togglePool(): void;
  openCreateFromDirectory(): void;
  closeCreateFromDirectory(): void;
}

export default class ProjectUiStateComponent extends Component<Args> {
  @service declare media: any;

  @tracked leftSidebarOpen = false;
  @tracked rightSidebarOpen = false;
  // the sample pool takes the left sidebar's place (the file browser and the pool never show together)
  @tracked poolOpen = false;
  @tracked audioSelectMode: AudioSelectMode = 'current_track';

  constructor(owner: any, args: Args) {
    super(owner, args);

    this.rightSidebarOpen = this.media.isDesktop;
  }

  get createFromDirectory() {
    return this.audioSelectMode === 'create_tracks';
  }

  get uiState() {
    return {
      leftSidebarOpen: this.leftSidebarOpen,
      rightSidebarOpen: this.rightSidebarOpen,
      poolOpen: this.poolOpen,
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
        this.poolOpen = false;
        this.leftSidebarOpen = !this.leftSidebarOpen;
        // If we're closing the left sidebar, also reset audioSelectMode
        if (!this.leftSidebarOpen) {
          this.audioSelectMode = 'current_track';
        }
      } else {
        this.rightSidebarOpen = !this.rightSidebarOpen;
      }
    }
  }

  @action
  closeSidebar(direction: 'left' | 'right') {
    if (direction === 'left') {
      this.poolOpen = false;
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

  @action
  togglePool() {
    this.poolOpen = !this.poolOpen;
    if (this.poolOpen) {
      this.leftSidebarOpen = false;
      this.audioSelectMode = 'current_track';
    }
  }

  @action
  openCreateFromDirectory() {
    this.poolOpen = false;
    this.audioSelectMode = 'create_tracks';
    this.leftSidebarOpen = true;
  }

  @action
  closeCreateFromDirectory() {
    this.audioSelectMode = 'current_track';
    this.leftSidebarOpen = false;
  }
}
