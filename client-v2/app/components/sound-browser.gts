import type { TOC } from '@ember/component/template-only';
import { on } from '@ember/modifier';
import Icon from 'client-v2/components/icon';

interface SoundEntry {
  name: string;
  folder?: boolean;
  /** the row the keyboard or pointer is on */
  selected?: boolean;
  /** the sound the target sampler holds now */
  current?: boolean;
  /** where in the project the sound is already used */
  badge?: string;
}

// Placeholder content: what the browser looks like inside a drum machine's folder.
const CRUMBS = ['Sounds', 'Roland', 'TR-808'] as const;

const ENTRIES: readonly SoundEntry[] = [
  { name: 'Kit 01', folder: true },
  { name: 'Kit 02', folder: true },
  { name: 'Loops', folder: true },
  { name: 'BD0000.mp3', current: true, badge: 'Track 1' },
  { name: 'BD7550.mp3' },
  { name: 'SD0010.mp3', selected: true },
  { name: 'SD7575.mp3' },
  { name: 'CH.mp3', badge: 'Track 3' },
  { name: 'OH25.mp3' },
  { name: 'CP.mp3' },
  { name: 'CB.mp3' },
  { name: 'RS.mp3' },
];

const HINTS = [
  { key: '↑↓', does: 'hear' },
  { key: '⏎', does: 'use' },
  { key: '→', does: 'open' },
  { key: '←', does: 'up' },
] as const;

function isLast(index: number, list: readonly unknown[]): boolean {
  return index === list.length - 1;
}

export interface SoundBrowserSignature {
  Element: HTMLElement;
  Args: {
    onClose: () => void;
  };
}

/** Sidebar region: the sound browser (target, search, folders, sounds). Static placeholder content apart from close. */
const SoundBrowser: TOC<SoundBrowserSignature> = <template>
  <aside
    class="sound-browser"
    aria-label="Sounds"
    data-test-sound-browser
    ...attributes
  >
    <header class="sound-browser__header">
      <h2 class="sound-browser__title">Sounds</h2>
      <button
        type="button"
        class="icon-btn sound-browser__close"
        aria-label="Close sounds"
        data-test-sidebar-close
        {{on "click" @onClose}}
      >
        <Icon @name="cancel" />
      </button>
    </header>

    <section class="target-card" aria-label="Where the next sound goes">
      <div class="target-card__label">
        <span>Adding to</span>
        <button type="button" class="target-card__change">change
          <Icon @name="play" class="icon--s icon--down" /></button>
      </div>
      <p class="target-card__target">Track 1
        <span><Icon @name="arrow" class="icon--m" /> Sampler</span></p>
    </section>

    <div class="sound-search" role="search">
      <Icon @name="search" />
      <input
        type="search"
        aria-label="Search for drum sounds"
        placeholder="Search sounds…"
        enterkeyhint="search"
        autocomplete="off"
      />
      <kbd aria-hidden="true">/</kbd>
    </div>

    <div class="segmented" role="group" aria-label="Which sounds">
      <button
        type="button"
        class="btn btn--ghost btn--s"
        aria-pressed="true"
      >All sounds</button>
      <button
        type="button"
        class="btn btn--ghost btn--s"
        aria-pressed="false"
      >In this project
        <b>3</b></button>
    </div>

    <nav class="breadcrumbs" aria-label="Folder">
      <button
        type="button"
        class="icon-btn breadcrumbs__up"
        aria-label="Up one folder"
      >
        <Icon @name="chevron" class="icon--back" />
      </button>
      <ol>
        {{#each CRUMBS as |crumb index|}}
          <li>
            {{#if index}}<Icon @name="chevron" class="icon--s" />{{/if}}
            <button
              type="button"
              class="breadcrumbs__crumb"
              aria-current={{if (isLast index CRUMBS) "location"}}
            >{{crumb}}</button>
          </li>
        {{/each}}
      </ol>
    </nav>

    <ul class="sound-list scroll-y" aria-label="Sounds" data-test-sound-list>
      {{#each ENTRIES as |entry|}}
        <li
          class="sound-row"
          data-selected={{if entry.selected "true"}}
          data-current={{if entry.current "true"}}
          data-test-sound-row
        >
          {{#if entry.folder}}
            <button
              type="button"
              class="sound-row__name sound-row__name--folder"
            >
              <span class="truncate">{{entry.name}}</span>
              <Icon @name="chevron" class="icon--m sound-row__chevron" />
            </button>
          {{else}}
            <button
              type="button"
              class="sound-row__play"
              aria-label="Audition {{entry.name}}"
            >
              <span><svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M2.6 0.8 L9.2 5 L2.6 9.2 Z" />
                </svg></span>
            </button>
            <button type="button" class="sound-row__name">
              <span class="truncate">{{entry.name}}</span>
            </button>
            {{#if entry.badge}}
              <span class="sound-row__badge truncate">{{entry.badge}}</span>
            {{/if}}
            <button
              type="button"
              class="btn btn--solid btn--s sound-row__use"
              aria-label="Use {{entry.name}}"
            >Use</button>
          {{/if}}
        </li>
      {{/each}}
    </ul>

    <p class="sound-hints" aria-hidden="true">
      {{#each HINTS as |hint|}}
        <span><kbd>{{hint.key}}</kbd>{{hint.does}}</span>
      {{/each}}
    </p>
  </aside>
</template>;

export default SoundBrowser;
