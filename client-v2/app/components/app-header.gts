import type { TOC } from '@ember/component/template-only';
import { on } from '@ember/modifier';
import Icon from 'client-v2/components/icon';
import Transport from 'client-v2/components/transport';

export interface AppHeaderSignature {
  Element: HTMLElement;
  Args: {
    sidebarOpen: boolean;
    /** the id of the sidebar element, for aria-controls */
    sidebarId: string;
    onToggleSidebar: () => void;
  };
}

/** Header region: the site nav bar over the project bar. It holds the transport, as in v1. Static apart from the sidebar toggle. */
const AppHeader: TOC<AppHeaderSignature> = <template>
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

      <h1 class="project-bar__title truncate" data-test-project-title>Untitled
        project</h1>

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
        <div class="project-bar__new">
          <button type="button" class="btn">New Track</button>
          <button type="button" class="btn" aria-label="Choose a kind of track">
            <Icon @name="play" class="icon--s icon--down" />
          </button>
        </div>
      </div>
    </div>
  </header>
</template>;

export default AppHeader;
