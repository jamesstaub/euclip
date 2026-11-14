import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import AppHeader from 'client-v2/components/app-header';
import SoundBrowser from 'client-v2/components/sound-browser';
import TrackFooter from 'client-v2/components/track-footer';
import TrackList from 'client-v2/components/track-list';
import onEscape from 'client-v2/modifiers/on-escape';
import shortcuts from 'client-v2/modifiers/shortcuts';
import { newTrack } from 'client-v2/project/default-project';
import { PROJECT_SCOPE, type TrackDocument } from 'client-v2/project/schema';
import type AudioService from 'client-v2/services/audio';
import type ProjectService from 'client-v2/services/project';

/** At this width and above the sidebar sits beside the tracks, so it starts open. Keep in step with app-shell.css. */
const SIDEBAR_BESIDE = '(min-width: 64rem)';

const SIDEBAR_ID = 'sound-browser';

/** How long "Removed … Undo" stays up. */
const NOTICE_MS = 8000;

export interface AppShellSignature {
  Element: HTMLDivElement;
  Args: {
    /** Whether the sidebar starts open. Default: open where it fits beside the tracks, closed where it is a drawer. */
    initialSidebarOpen?: boolean;
  };
}

/**
 * The app frame: a CSS grid with the areas header, sidebar, tracks and footer (see styles/app-shell.css).
 *
 * It starts the project (loads it and boots the audio engine) and holds what belongs to this sitting,
 * not to the project: which track is selected and whether the sidebar is open. The project itself is
 * the `project` service's; what is running is the `audio` service's.
 */
export default class AppShell extends Component<AppShellSignature> {
  @service declare audio: AudioService;
  @service declare project: ProjectService;

  @tracked sidebarOpen =
    this.args.initialSidebarOpen ?? window.matchMedia(SIDEBAR_BESIDE).matches;

  /** A track's id, PROJECT_SCOPE for the main output, or undefined: the first track. */
  @tracked private chosenId: string | undefined;

  /** What was just removed, while there is still time to take it back. */
  @tracked notice: string | undefined;
  #noticeTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(owner: unknown, args: AppShellSignature['Args']) {
    super(owner as never, args);
    void this.audio.boot();
  }

  willDestroy(): void {
    super.willDestroy();
    clearTimeout(this.#noticeTimer);
  }

  /** The selected track, or null when the main output is selected. */
  get selectedTrack(): TrackDocument | null {
    const tracks = this.project.tracks;
    if (this.chosenId === PROJECT_SCOPE) return null;
    return (
      tracks.find((track) => track.id === this.chosenId) ?? tracks[0] ?? null
    );
  }

  get selectedId(): string {
    return this.selectedTrack?.id ?? PROJECT_SCOPE;
  }

  get selectedOrder(): number {
    return (
      this.project.tracks.findIndex((track) => track.id === this.selectedId) + 1
    );
  }

  /** The main output houses the project script; every track has its own. */
  get selectedScript(): string {
    return this.selectedTrack?.script ?? this.project.doc.script;
  }

  get projectError(): string | undefined {
    return this.audio.error(PROJECT_SCOPE)?.message;
  }

  toggleSidebar = (): void => {
    this.sidebarOpen = !this.sidebarOpen;
  };

  closeSidebar = (): void => {
    this.sidebarOpen = false;
  };

  select = (id: string): void => {
    this.chosenId = id;
  };

  /** An edit in the editor. It is the document's script from this moment; it runs after a pause. */
  setScript = (script: string): void => {
    this.project.apply({ type: 'setScript', scope: this.selectedId, script });
  };

  addTrack = (): void => {
    const track = newTrack(`track ${this.project.tracks.length + 1}`);
    this.project.apply({ type: 'addTrack', track });
    this.chosenId = track.id;
  };

  removeTrack = (track: TrackDocument): void => {
    const index = this.project.tracks.findIndex(
      (candidate) => candidate.id === track.id,
    );
    this.project.apply({ type: 'removeTrack', id: track.id });
    if (this.chosenId === track.id) {
      // the track that takes its place, or the one before, or the main output
      const tracks = this.project.tracks;
      this.chosenId = (tracks[index] ?? tracks[index - 1])?.id ?? PROJECT_SCOPE;
    }
    this.notice = `Removed ${track.name}.`;
    clearTimeout(this.#noticeTimer);
    this.#noticeTimer = setTimeout(() => (this.notice = undefined), NOTICE_MS);
  };

  undo = (): void => {
    this.project.undo();
    this.dismissNotice();
  };

  redo = (): void => this.project.redo();

  dismissNotice = (): void => {
    clearTimeout(this.#noticeTimer);
    this.notice = undefined;
  };

  togglePlay = (): void => this.audio.toggle();

  <template>
    <div
      class="app-shell"
      data-sidebar={{if this.sidebarOpen "open" "closed"}}
      data-ready={{if this.audio.ready "true" "false"}}
      data-test-app-shell
      ...attributes
      {{shortcuts onSpace=this.togglePlay onUndo=this.undo onRedo=this.redo}}
    >
      <AppHeader
        class="app-shell__header"
        @projectName={{this.project.doc.name}}
        @sidebarOpen={{this.sidebarOpen}}
        @sidebarId={{SIDEBAR_ID}}
        @onToggleSidebar={{this.toggleSidebar}}
        @onNewTrack={{this.addTrack}}
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
        @tracks={{this.project.tracks}}
        @selectedId={{this.selectedId}}
        @onSelect={{this.select}}
        @onRemove={{this.removeTrack}}
        @projectError={{this.projectError}}
      />

      {{#if this.notice}}
        <p class="app-shell__notice" role="status" data-test-notice>
          <span>{{this.notice}}</span>
          <button
            type="button"
            class="btn btn--s"
            data-test-undo
            {{on "click" this.undo}}
          >Undo</button>
          <button
            type="button"
            class="btn btn--s btn--ghost"
            aria-label="Dismiss"
            {{on "click" this.dismissNotice}}
          >×</button>
        </p>
      {{/if}}

      <TrackFooter
        class="app-shell__footer"
        @track={{this.selectedTrack}}
        @order={{this.selectedOrder}}
        @script={{this.selectedScript}}
        @onScriptChange={{this.setScript}}
      />
    </div>
  </template>
}
