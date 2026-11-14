import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import AppHeader from 'client-v2/components/app-header';
import SoundBrowser from 'client-v2/components/sound-browser';
import TrackFooter from 'client-v2/components/track-footer';
import TrackList from 'client-v2/components/track-list';
import onEscape from 'client-v2/modifiers/on-escape';
import {
  initialScripts,
  PROJECT_ID,
  TRACKS,
  type TrackPlaceholder,
} from 'client-v2/utils/placeholder-tracks';

/** At this width and above the sidebar sits beside the tracks, so it starts open. Keep in step with app-shell.css. */
const SIDEBAR_BESIDE = '(min-width: 64rem)';

const SIDEBAR_ID = 'sound-browser';

export interface AppShellSignature {
  Element: HTMLDivElement;
  Args: {
    /** Whether the sidebar starts open. Default: open where it fits beside the tracks, closed where it is a drawer. */
    initialSidebarOpen?: boolean;
  };
}

/**
 * The app frame: a CSS grid with the areas header, sidebar, tracks and footer (see styles/app-shell.css).
 * It holds the placeholder project's state (which track is selected, the text of each script, in memory
 * only) and whether the sidebar is open. How the footer is viewed is the `view` service's.
 */
export default class AppShell extends Component<AppShellSignature> {
  @tracked sidebarOpen =
    this.args.initialSidebarOpen ?? window.matchMedia(SIDEBAR_BESIDE).matches;

  @tracked selectedTrack: TrackPlaceholder = TRACKS[0]!;

  @tracked scripts: Readonly<Record<string, string>> = initialScripts();

  /** The main output houses the project script; every other track has its own. */
  get selectedScriptId(): string {
    return this.selectedTrack.output ? PROJECT_ID : this.selectedTrack.id;
  }

  get selectedScript(): string {
    return this.scripts[this.selectedScriptId] ?? '';
  }

  toggleSidebar = (): void => {
    this.sidebarOpen = !this.sidebarOpen;
  };

  closeSidebar = (): void => {
    this.sidebarOpen = false;
  };

  selectTrack = (track: TrackPlaceholder): void => {
    this.selectedTrack = track;
  };

  /** An edit in an editor. Nothing runs: the text is only kept. */
  setScript = (id: string, value: string): void => {
    if (this.scripts[id] !== value) {
      this.scripts = { ...this.scripts, [id]: value };
    }
  };

  setSelectedScript = (value: string): void =>
    this.setScript(this.selectedScriptId, value);

  <template>
    <div
      class="app-shell"
      data-sidebar={{if this.sidebarOpen "open" "closed"}}
      data-test-app-shell
      ...attributes
    >
      <AppHeader
        class="app-shell__header"
        @sidebarOpen={{this.sidebarOpen}}
        @sidebarId={{SIDEBAR_ID}}
        @onToggleSidebar={{this.toggleSidebar}}
      />

      {{#if this.sidebarOpen}}
        {{! only shown where the sidebar is a drawer; the drawer's own close button is the keyboard way out }}
        <button
          type="button"
          class="app-shell__scrim"
          tabindex="-1"
          aria-label="Close sounds"
          data-test-sidebar-scrim
          {{on "click" this.closeSidebar}}
        ></button>
        <SoundBrowser
          id={{SIDEBAR_ID}}
          class="app-shell__sidebar"
          @onClose={{this.closeSidebar}}
          {{onEscape this.closeSidebar}}
        />
      {{/if}}

      <TrackList
        class="app-shell__tracks"
        @tracks={{TRACKS}}
        @selected={{this.selectedTrack}}
        @onSelect={{this.selectTrack}}
      />
      <TrackFooter
        class="app-shell__footer"
        @track={{this.selectedTrack}}
        @script={{this.selectedScript}}
        @onScriptChange={{this.setSelectedScript}}
      />
    </div>
  </template>
}
