import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import type ProjectUiStateComponent from 'euclip/components/project/ui-state';

/**
 * Lets route templates/controllers (e.g. the track footer, which renders in an
 * {{outlet}} and so can't receive the yielded `uiState`) reach the
 * Project::UiState component for the project currently on screen.
 */
export type FooterTab = 'sequence' | 'source' | 'controls';

export default class ProjectUiService extends Service {
  // which tab of the track footer is showing; the track list can switch it (e.g. its source button)
  @tracked footerTab: FooterTab = 'controls';

  @tracked current: ProjectUiStateComponent | null = null;

  // the source node being edited, shared by the source menu and the file sidebar (see ui-state)
  get selectedSourceIdx(): number {
    return this.current?.selectedSourceIdx ?? 0;
  }

  // `trackId` for a track that is about to become the active one (its row was just clicked)
  setSelectedSourceIdx(idx: number, trackId?: string) {
    this.current?.setSelectedSourceIdx(idx, trackId);
  }

  get leftSidebarOpen() {
    return this.current?.leftSidebarOpen ?? false;
  }

  get rightSidebarOpen() {
    return this.current?.rightSidebarOpen ?? false;
  }
}
