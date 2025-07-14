import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

type Args = {
  activeTrack?: any;
  project?: any;
};

export type AudioSelectMode = 'file' | 'dir';

export interface ProjectUiStateProps {
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  audioSelectMode: AudioSelectMode;
}

export interface ProjectUiStateActions {
  toggleSidebar(trackId: string, direction: 'left' | 'right'): void;
  closeSidebar(direction: 'left' | 'right'): void;
  setAudioSelectMode(mode: AudioSelectMode): void;
  openCreateFromDirectory(): void;
  closeCreateFromDirectory(): void;
}

export default class ProjectUiStateComponent extends Component<Args> {
  @service declare media: any;

  @tracked leftSidebarOpen = false;
  @tracked rightSidebarOpen = false;
  @tracked audioSelectMode: AudioSelectMode = 'file';

  constructor(owner: any, args: Args) {
    super(owner, args);

    this.rightSidebarOpen = this.media.isDesktop;
  }

  get createFromDirectory() {
    return this.audioSelectMode === 'dir';
  }

  get uiState() {
    return {
      leftSidebarOpen: this.leftSidebarOpen,
      rightSidebarOpen: this.rightSidebarOpen,
      audioSelectMode: this.audioSelectMode,
      createFromDirectory: this.createFromDirectory,
      toggleSidebar: this.toggleSidebar,
      closeSidebar: this.closeSidebar,
      setAudioSelectMode: this.setAudioSelectMode,
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
        // If we're closing the left sidebar, also reset audioSelectMode
        if (!this.leftSidebarOpen) {
          this.audioSelectMode = 'file';
        }
      } else {
        this.rightSidebarOpen = !this.rightSidebarOpen;
      }
    }
  }

  @action
  closeSidebar(direction: 'left' | 'right') {
    if (direction === 'left') {
      this.leftSidebarOpen = false;
      this.audioSelectMode = 'file';
    } else {
      this.rightSidebarOpen = false;
    }
  }

  @action
  setAudioSelectMode(mode: AudioSelectMode) {
    this.audioSelectMode = mode;
  }

  @action
  openCreateFromDirectory() {
    this.audioSelectMode = 'dir';
    this.leftSidebarOpen = true;
  }

  @action
  closeCreateFromDirectory() {
    this.audioSelectMode = 'file';
    this.leftSidebarOpen = false;
  }
}
