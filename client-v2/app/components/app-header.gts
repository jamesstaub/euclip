import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import onOutside from 'client-v2/modifiers/on-outside';
import Icon from 'client-v2/components/icon';
import Transport from 'client-v2/components/transport';

export interface AppHeaderSignature {
  Element: HTMLElement;
  Args: {
    projectName: string;
    sidebarOpen: boolean;
    /** the id of the sidebar element, for aria-controls */
    sidebarId: string;
    onToggleSidebar: () => void;
    onNewTrack: () => void;
    /** the other kind of track in the New Track menu: a loop played slice by slice */
    onNewSlicedLoop?: () => void;
  };
}

/**
 * Header region: the site nav bar over the project bar. It holds the transport, as in v1. The site links
 * and snapshots are inert. New Track adds a sampler track; the arrow beside it offers the other kinds.
 */
export default class AppHeader extends Component<AppHeaderSignature> {
  @tracked kindsOpen = false;

  toggleKinds = (): void => {
    this.kindsOpen = !this.kindsOpen;
  };

  closeKinds = (): void => {
    this.kindsOpen = false;
  };

  addSampler = (): void => {
    this.kindsOpen = false;
    this.args.onNewTrack();
  };

  addSlicedLoop = (): void => {
    this.kindsOpen = false;
    this.args.onNewSlicedLoop?.();
  };

  onKindsKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.kindsOpen) {
      event.stopPropagation();
      this.kindsOpen = false;
    }
  };

  <template>
    <header class="app-header" data-test-app-header ...attributes>
      <nav class="app-nav" aria-label="Site">
        <span class="app-nav__logo">
          <img src="/icons/logo.svg" alt="Euclip" width="180" height="37" />
        </span>
        <div class="app-nav__links">
          <button type="button" class="app-nav__link">about</button>
          <button type="button" class="app-nav__link app-nav__link--accent">new
            project</button>
          <button
            type="button"
            class="app-nav__account"
            aria-label="Account menu"
          >
            <span class="app-nav__avatar" aria-hidden="true">j</span>
          </button>
        </div>
      </nav>

      <div class="project-bar">
        <button
          type="button"
          class="btn project-bar__toggle"
          aria-label="Sounds"
          aria-expanded={{if @sidebarOpen "true" "false"}}
          aria-controls={{@sidebarId}}
          aria-pressed={{if @sidebarOpen "true" "false"}}
          data-test-sidebar-toggle
          {{on "click" @onToggleSidebar}}
        >
          <Icon @name="sound" />
          <span class="project-bar__toggle-label">Sounds</span>
        </button>

        <h1
          class="project-bar__title truncate"
          data-test-project-title
        >{{@projectName}}</h1>

        <Transport class="project-bar__transport" />

        <div class="project-bar__actions">
          <button
            type="button"
            class="btn btn--s"
            aria-label="Snapshots"
            aria-pressed="false"
          >
            <Icon @name="snapshots" />
          </button>
          {{! template-lint-disable no-invalid-interactive }}
          <div
            class="project-bar__new"
            {{onOutside this.closeKinds}}
            {{on "keydown" this.onKindsKey}}
          >
            <button
              type="button"
              class="btn"
              data-test-new-track
              {{on "click" @onNewTrack}}
            >New Track</button>
            <button
              type="button"
              class="btn"
              aria-label="Choose a kind of track"
              aria-haspopup="menu"
              aria-expanded={{if this.kindsOpen "true" "false"}}
              data-test-new-track-kinds
              {{on "click" this.toggleKinds}}
            >
              <Icon @name="play" class="icon--s icon--down" />
            </button>
            {{#if this.kindsOpen}}
              <ul
                class="menu project-bar__kinds"
                role="menu"
                aria-label="Kinds of track"
              >
                <li role="none">
                  <button
                    type="button"
                    class="menu__item"
                    role="menuitem"
                    data-test-new-sampler
                    {{on "click" this.addSampler}}
                  >Sampler</button>
                </li>
                <li role="none">
                  <button
                    type="button"
                    class="menu__item"
                    role="menuitem"
                    data-test-new-sliced-loop
                    {{on "click" this.addSlicedLoop}}
                  >Sliced loop</button>
                </li>
              </ul>
            {{/if}}
          </div>
        </div>
      </div>
    </header>
  </template>
}
