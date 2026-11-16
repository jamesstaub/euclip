import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import { isDestroying } from '@ember/destroyable';
import { buildWaiter, waitForPromise } from '@ember/test-waiters';
import { modifier } from 'ember-modifier';
import Icon from 'client-v2/components/icon';
import Hint from 'client-v2/components/ui/hint';
import PopupMenu, { type MenuItem } from 'client-v2/components/ui/popup-menu';
import type { WaveformView } from 'client-v2/audio/runner';
import {
  crumbsOf,
  folderPath,
  parentOf,
  type LibraryFile,
  type LibraryFolder,
} from 'client-v2/library/client';
import selectOptions, {
  type SelectOption,
} from 'client-v2/modifiers/select-options';
import { MAX_FILE_TEXT } from 'client-v2/project/pool';
import type { ShelfEntry } from 'client-v2/project/storage';
import type { PoolEntry, SoundRef } from 'client-v2/services/audio';
import type AudioService from 'client-v2/services/audio';
import type ViewService from 'client-v2/services/view';
import type { SoundsTab } from 'client-v2/services/view';

const HINTS = [
  { key: '↑↓', does: 'hear the next or the one before' },
  { key: '⏎', does: 'use (or open a folder)' },
  { key: '→', does: 'open a folder' },
  { key: '←', does: 'up one folder' },
  { key: '/', does: 'search' },
] as const;

/** How long after the last key a search is sent. */
export const SEARCH_DELAY_MS = 300;

const searchWaiter = buildWaiter('euclip:sound-search');

/** A line of the list: a folder to open, or a sound to hear and use. */
interface Row {
  id: string;
  name: string;
  /** a folder of the library: its path */
  folder?: string;
  sound?: SoundRef;
  /** a quieter second line: where a search result is, how long one of the person's files is */
  detail?: string;
  /** the project sound this already is, when it is one */
  inProject?: string;
  /** where the project uses it, shortly: "T1, T3" */
  usedBy?: string;
  /** ...and in full: "Used by Track 1, Track 3" */
  usedFull?: string;
  /** a project sound's entry, for its state and housekeeping */
  entry?: PoolEntry;
}

export interface SoundBrowserSignature {
  Element: HTMLElement;
  Args: {
    onClose: () => void;
    /** a sound was given to a sampler (where the browser is a drawer, it then gets out of the way) */
    onUsed?: () => void;
    /** the selected track's id (or the project scope): where "Use" puts a sound */
    scopeId?: string;
    /** what to call it: "Track 1" */
    targetName?: string;
  };
}

function eq(a: unknown, b: unknown): boolean {
  return a === b;
}

function seconds(value: number | null): string {
  return value === null ? '' : `${Number(value.toFixed(2))} s`;
}

function megabytes(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function isLast(index: number, list: readonly unknown[]): boolean {
  return index === list.length - 1;
}

const TABS: readonly { id: SoundsTab; label: string }[] = [
  { id: 'library', label: 'Library' },
  { id: 'mine', label: 'My sounds' },
  { id: 'project', label: 'This project' },
];

const FROM: Readonly<Record<PoolEntry['from'], string>> = {
  library: 'library',
  mine: 'my sound',
  'built-in': 'built-in',
};

/** Keeps the row the keys are on in view. */
const keepInView = modifier<{
  Element: HTMLElement;
  Args: { Positional: [selected: boolean] };
}>((element, [selected]) => {
  if (selected) element.scrollIntoView?.({ block: 'nearest' });
});

/** Focus goes to the field as it appears, its text selected. */
const focusNow = modifier<{ Element: HTMLInputElement }>((element) => {
  element.focus();
  element.select();
});

/**
 * Sidebar region: the sound browser.
 *
 * Three places a sound can be, one way round: the **Library** (everything Euclip offers, on the
 * server) and **My sounds** (the person's own files, kept across their projects) are where sounds come
 * from; **This project** is the named sounds this project's scripts refer to. Hear plays a sound and
 * changes nothing. Use puts it in the project if it is not there and gives it to the sampler the card
 * at the top names. Add puts it in the project without giving it to anything.
 */
export default class SoundBrowser extends Component<SoundBrowserSignature> {
  @service declare audio: AudioService;
  @service declare view: ViewService;

  /** the row the keys (or the last press) are on */
  @tracked selected = -1;
  @tracked notice: string | null = null;
  @tracked dropping = false;

  // the library
  @tracked path = '/';
  @tracked folder: LibraryFolder | null = null;
  @tracked folderState: 'loading' | 'ready' | 'error' = 'loading';
  @tracked folderError: string | null = null;
  @tracked query = '';
  @tracked found: LibraryFile[] | null = null;
  @tracked searchState: 'idle' | 'loading' | 'ready' | 'error' = 'idle';
  @tracked searchError: string | null = null;
  @tracked more = false;
  #page = 0;
  #searchTimer: ReturnType<typeof setTimeout> | undefined;
  #searchToken: unknown;
  #searching: AbortController | null = null;
  #reading = 0;
  #path = '/';

  // the person's own
  @tracked shelf: ShelfEntry[] = [];
  #shelfSeen = -1;

  // housekeeping in the project
  @tracked menuFor: string | null = null;
  @tracked renaming: string | null = null;
  @tracked renameText = '';
  @tracked renameProblem: string | null = null;
  @tracked removing: string | null = null;

  constructor(owner: unknown, args: SoundBrowserSignature['Args']) {
    super(owner as never, args);
    void this.open('/');
  }

  willDestroy(): void {
    super.willDestroy();
    this.#endSearchWait();
    this.#searching?.abort();
    this.audio.stopHearing();
  }

  get tab(): SoundsTab {
    return this.view.soundsTab;
  }

  showTab = (tab: SoundsTab): void => {
    this.view.soundsTab = tab;
    this.selected = -1;
    this.notice = null;
    if (tab === 'mine') void this.readShelf();
  };

  // --- where Use puts a sound --------------------------------------------------------------------------

  /** The samplers of the selected track that can be given a sound. */
  get targets(): WaveformView[] {
    const scopeId = this.args.scopeId;
    return scopeId === undefined
      ? []
      : this.audio.waveforms(scopeId).filter((waveform) => waveform.choosable);
  }

  /** The one Use gives a sound to: the one asked for (Browse… from its picker, or Change), else the first. */
  get target(): WaveformView | undefined {
    const asked = this.view.soundTarget;
    const targets = this.targets;
    return (
      (asked && asked.scopeId === this.args.scopeId
        ? targets.find((waveform) => waveform.key === asked.key)
        : undefined) ?? targets[0]
    );
  }

  get targetChoices(): readonly SelectOption[] {
    return this.targets.map((waveform) => ({
      value: waveform.key,
      label: waveform.label,
    }));
  }

  changeTarget = (event: Event): void => {
    const scopeId = this.args.scopeId;
    if (scopeId === undefined) return;
    this.view.soundTarget = {
      scopeId,
      key: (event.target as HTMLSelectElement).value,
    };
  };

  // --- the rows ---------------------------------------------------------------------------------------

  get pool(): PoolEntry[] {
    return this.audio.pool();
  }

  /** What a source is called in this project and where it is used, by its source string. */
  get #known(): Map<string, PoolEntry> {
    return new Map(this.pool.map((entry) => [entry.source, entry]));
  }

  #libraryRow(file: LibraryFile, detail?: string): Row {
    const entry = this.#known.get(`library:${file.path}`);
    return {
      id: `library:${file.path}`,
      name: file.name,
      sound: { kind: 'library', path: file.path, name: file.name },
      ...(detail === undefined ? {} : { detail }),
      ...(entry
        ? {
            inProject: entry.name,
            usedBy: used(entry),
            usedFull: usedFull(entry),
          }
        : {}),
    };
  }

  get searching(): boolean {
    return this.tab === 'library' && this.query.trim() !== '';
  }

  get rows(): Row[] {
    if (this.tab === 'project') {
      return this.pool.map((entry) => ({
        id: `project:${entry.name}`,
        name: entry.name,
        sound: { kind: 'project', name: entry.name },
        inProject: entry.name,
        usedBy: used(entry),
        usedFull: usedFull(entry),
        entry,
      }));
    }
    if (this.tab === 'mine') {
      // (asked for again when a file is added or supplied)
      if (this.#shelfSeen !== this.audio.shelfRevision) void this.readShelf();
      return this.shelf.map((file) => {
        const entry = this.#known.get(`file:${file.id}`);
        return {
          id: `file:${file.id}`,
          name: file.name,
          sound: { kind: 'mine', id: file.id, name: file.name },
          detail: megabytes(file.size),
          ...(entry
            ? {
                inProject: entry.name,
                usedBy: used(entry),
                usedFull: usedFull(entry),
              }
            : {}),
        };
      });
    }
    if (this.searching) {
      return (this.found ?? []).map((file) =>
        this.#libraryRow(file, file.path.slice(1, -file.name.length - 1)),
      );
    }
    const folder = this.folder;
    if (!folder) return [];
    return [
      ...folder.folders.map((name) => ({
        id: `folder:${folder.path}${name}/`,
        name,
        folder: `${folder.path}${name}/`,
      })),
      ...folder.files.map((file) => this.#libraryRow(file)),
    ];
  }

  get crumbs(): { name: string; path: string }[] {
    const names = crumbsOf(this.path);
    return [
      { name: 'Library', path: '/' },
      ...names.map((name, index) => ({
        name,
        path: folderPath(names.slice(0, index + 1).join('/')),
      })),
    ];
  }

  get atRoot(): boolean {
    return this.path === '/';
  }

  isHearing = (row: Row): boolean => this.audio.hearing?.id === row.id;

  hearState = (row: Row): string | undefined =>
    this.audio.hearing?.id === row.id ? this.audio.hearing.state : undefined;

  failure = (row: Row): string | undefined =>
    this.audio.failed?.id === row.id ? this.audio.failed.message : undefined;

  // --- the library ------------------------------------------------------------------------------------

  open = async (path: string): Promise<void> => {
    const reading = ++this.#reading;
    const next = folderPath(path);
    // (not written when it is where we are: this also runs as the browser is first drawn)
    if (next !== this.#path) {
      this.#path = next;
      this.path = next;
    }
    this.selected = -1;
    this.folderState = 'loading';
    this.folderError = null;
    try {
      const folder = await waitForPromise(this.audio.library.folder(next));
      if (reading !== this.#reading || isDestroying(this)) return;
      this.folder = folder;
      this.folderState = 'ready';
    } catch (error) {
      if (reading !== this.#reading || isDestroying(this)) return;
      this.folder = null;
      this.folderState = 'error';
      this.folderError = error instanceof Error ? error.message : String(error);
    }
  };

  up = (): void => {
    const parent = parentOf(this.#path);
    if (parent !== null) void this.open(parent);
  };

  retryFolder = (): void => void this.open(this.#path);

  #endSearchWait(): void {
    clearTimeout(this.#searchTimer);
    if (this.#searchToken !== undefined) {
      searchWaiter.endAsync(this.#searchToken);
      this.#searchToken = undefined;
    }
  }

  onSearch = (event: Event): void => {
    this.query = (event.target as HTMLInputElement).value;
    this.view.soundsTab = 'library';
    this.selected = -1;
    this.#endSearchWait();
    this.#searching?.abort();
    if (this.query.trim() === '') {
      this.found = null;
      this.searchState = 'idle';
      return;
    }
    // a pause in the typing is what sends it
    this.searchState = 'loading';
    this.#searchToken = searchWaiter.beginAsync();
    this.#searchTimer = setTimeout(() => {
      this.#endSearchWait();
      void this.search(0);
    }, SEARCH_DELAY_MS);
  };

  clearSearch = (): void => {
    this.#endSearchWait();
    this.#searching?.abort();
    this.query = '';
    this.found = null;
    this.searchState = 'idle';
  };

  search = async (page: number): Promise<void> => {
    const query = this.query.trim();
    if (query === '') return;
    this.#searching?.abort();
    const asking = new AbortController();
    this.#searching = asking;
    this.searchState = 'loading';
    this.searchError = null;
    try {
      const result = await waitForPromise(
        this.audio.library.search(query, page, asking.signal),
      );
      if (asking.signal.aborted || isDestroying(this)) return;
      this.#page = page;
      this.found =
        page === 0 ? result.files : [...(this.found ?? []), ...result.files];
      this.more = result.more;
      this.searchState = 'ready';
    } catch (error) {
      if (asking.signal.aborted || isDestroying(this)) return;
      this.searchState = 'error';
      this.searchError = error instanceof Error ? error.message : String(error);
    }
  };

  moreResults = (): void => void this.search(this.#page + 1);
  retrySearch = (): void => void this.search(0);

  // --- hear, use, add ---------------------------------------------------------------------------------

  select = (index: number): void => {
    this.selected = index;
  };

  hear = (row: Row, index: number): void => {
    this.selected = index;
    if (row.sound) void waitForPromise(this.audio.hear(row.sound));
  };

  use = (row: Row, index: number): void => {
    this.selected = index;
    const target = this.target;
    const scopeId = this.args.scopeId;
    if (!row.sound || !target || scopeId === undefined) return;
    void waitForPromise(
      this.audio.useSound(row.sound, { scopeId, soundKey: target.soundKey }),
    ).then((name) => {
      if (name === undefined || isDestroying(this)) return;
      this.notice = `${target.label} now plays '${name}'.`;
      this.args.onUsed?.();
    });
  };

  add = (row: Row, index: number): void => {
    this.selected = index;
    if (!row.sound) return;
    const name = this.audio.addToProject(row.sound);
    if (name !== undefined) this.notice = `In this project as '${name}'.`;
  };

  activate = (row: Row, index: number): void => {
    if (row.folder !== undefined) void this.open(row.folder);
    else this.hear(row, index);
  };

  /** The keys of the list: up and down hear, Enter uses, right opens, left goes up. */
  onListKey = (event: KeyboardEvent): void => {
    const target = event.target as HTMLElement;
    if (target.closest('input, select, [role="menu"]')) return;
    const rows = this.rows;
    const move = (to: number): void => {
      if (rows.length === 0) return;
      const index = Math.min(rows.length - 1, Math.max(0, to));
      event.preventDefault();
      this.selected = index;
      const row = rows[index]!;
      if (row.sound && this.audio.hearing?.id !== row.id) {
        void waitForPromise(this.audio.hear(row.sound));
      }
    };
    const row = rows[this.selected];
    switch (event.key) {
      case 'ArrowDown':
        return move(this.selected + 1);
      case 'ArrowUp':
        return move(this.selected - 1);
      case 'ArrowRight':
        if (row?.folder !== undefined) {
          event.preventDefault();
          void this.open(row.folder);
        }
        return;
      case 'ArrowLeft':
        if (this.tab === 'library' && !this.searching && !this.atRoot) {
          event.preventDefault();
          this.up();
        }
        return;
      case 'Enter':
        // (on a button, Enter is that button's)
        if (!row || target.closest('button')) return;
        event.preventDefault();
        if (row.folder !== undefined) void this.open(row.folder);
        else this.use(row, this.selected);
        return;
    }
  };

  /** `/` anywhere in the browser goes to the search field. */
  onKey = (event: KeyboardEvent): void => {
    if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey)
      return;
    if ((event.target as HTMLElement).closest('input, select, textarea'))
      return;
    const field = (
      event.currentTarget as HTMLElement
    ).querySelector<HTMLInputElement>('[data-test-sound-search]');
    if (field) {
      event.preventDefault();
      field.focus();
    }
  };

  // --- the person's own ---------------------------------------------------------------------------------

  readShelf = async (): Promise<void> => {
    this.#shelfSeen = this.audio.shelfRevision;
    const shelf = await waitForPromise(this.audio.shelf());
    if (!isDestroying(this)) this.shelf = shelf;
  };

  pickFile = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) void this.addFile(file);
  };

  async addFile(file: File): Promise<void> {
    this.view.soundsTab = 'mine';
    this.notice = `Adding “${file.name}”…`;
    const result = await waitForPromise(this.audio.shelveFile(file));
    if (isDestroying(this)) return;
    this.notice =
      typeof result.error === 'string'
        ? result.error
        : 'Added to My sounds. Use it, or add it to the project.';
    await this.readShelf();
  }

  supply = (name: string, event: Event): void => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.notice = `Reading “${file.name}”…`;
    void waitForPromise(this.audio.supplyFile(name, file)).then((problem) => {
      if (!isDestroying(this)) {
        this.notice = problem ?? `'${name}' has its file again.`;
      }
    });
  };

  onDragOver = (event: DragEvent): void => {
    if (!event.dataTransfer?.types.includes('Files')) return;
    event.preventDefault();
    this.dropping = true;
  };

  onDragLeave = (): void => {
    this.dropping = false;
  };

  onDrop = (event: DragEvent): void => {
    this.dropping = false;
    const file = event.dataTransfer?.files[0];
    if (!file) return;
    event.preventDefault();
    void this.addFile(file);
  };

  // --- housekeeping in the project ------------------------------------------------------------------------

  menuItems = (entry: PoolEntry): MenuItem[] => [
    { label: 'Rename…', onSelect: () => this.startRename(entry.name) },
    {
      label: 'Duplicate',
      onSelect: () => {
        const as = this.audio.duplicateSound(entry.name);
        this.notice = `'${as}' is the same sound as '${entry.name}', with slices of its own.`;
      },
    },
    {
      label: 'Remove…',
      separated: true,
      onSelect: () => this.askRemove(entry),
    },
  ];

  isMenuOpen = (name: string): boolean => this.menuFor === name;

  setMenu = (name: string, open: boolean): void => {
    this.menuFor = open ? name : this.menuFor === name ? null : this.menuFor;
  };

  askRemove = (entry: PoolEntry): void => {
    if (entry.uses.length === 0) {
      this.audio.removeSound(entry.name);
      this.notice = `'${entry.name}' is out of the project. Undo brings it back.`;
    } else {
      this.removing = entry.name;
    }
  };

  cancelRemove = (): void => {
    this.removing = null;
  };

  confirmRemove = (): void => {
    const name = this.removing;
    this.removing = null;
    if (name === null) return;
    this.audio.removeSound(name);
    this.notice = `'${name}' is out of the project. Undo brings it back.`;
  };

  startRename = (name: string): void => {
    this.renaming = name;
    this.renameText = name;
    this.renameProblem = null;
  };

  onRenameInput = (event: Event): void => {
    this.renameText = (event.target as HTMLInputElement).value;
    this.renameProblem =
      this.renameText === this.renaming
        ? null
        : this.audio.soundNameProblem(
            this.renameText,
            this.renaming ?? undefined,
          );
  };

  cancelRename = (): void => {
    this.renaming = null;
  };

  /** How many scripts name the sound being renamed: text the person wrote, changed only if they say so. */
  get renameScripts(): number {
    const entry = this.pool.find(
      (candidate) => candidate.name === this.renaming,
    );
    return entry ? entry.uses.filter((use) => use.written > 0).length : 0;
  }

  get renameWhere(): string {
    const entry = this.pool.find(
      (candidate) => candidate.name === this.renaming,
    );
    return entry
      ? entry.uses
          .filter((use) => use.written > 0)
          .map((use) => use.label)
          .join(', ')
      : '';
  }

  get canRename(): boolean {
    return (
      this.renaming !== null &&
      this.renameText !== this.renaming &&
      this.audio.soundNameProblem(this.renameText, this.renaming) === null
    );
  }

  /** Renames; where scripts name the sound, only as "rename and update N scripts". One step to undo. */
  commitRename = (event?: Event): void => {
    event?.preventDefault();
    const from = this.renaming;
    if (from === null || !this.canRename) return;
    const scripts = this.renameScripts;
    this.audio.renameSound(from, this.renameText, scripts > 0);
    this.notice =
      scripts > 0
        ? `'${from}' is now '${this.renameText}', in ${scripts} ${scripts === 1 ? 'script' : 'scripts'} too. Undo takes all of it back.`
        : `'${from}' is now '${this.renameText}'.`;
    this.renaming = null;
  };

  onRenameKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      this.cancelRename();
    }
  };

  <template>
    {{! template-lint-disable no-invalid-interactive }}
    {{! an audio file can be dropped anywhere on the sidebar; "/" goes to the search field }}
    <aside
      class="sound-browser {{if this.dropping 'sound-browser--dropping'}}"
      aria-label="Sounds"
      data-test-sound-browser
      ...attributes
      {{on "dragover" this.onDragOver}}
      {{on "dragleave" this.onDragLeave}}
      {{on "drop" this.onDrop}}
      {{on "keydown" this.onKey}}
    >
      <header class="sound-browser__header">
        <h2 class="sound-browser__title">Sounds</h2>
        <Hint
          class="sound-browser__hint"
          @label="About the sound browser"
          data-test-sounds-hint
        >
          <p><b>Library</b>
            is everything Euclip offers.
            <b>My sounds</b>
            are files you added, kept in this browser across your projects (up
            to
            {{MAX_FILE_TEXT}}
            each).
            <b>This project</b>
            lists the sounds this project’s scripts can name.</p>
          <p>▶ hears a sound and changes nothing.
            <b>Use</b>
            puts it in the project if it is not there yet, and gives it to the
            sampler named at the top.
            <b>+</b>
            puts it in the project without giving it to anything.</p>
          <p>Drop an audio file anywhere on this panel to add it to My sounds.</p>
          <ul>
            {{#each HINTS as |hint|}}
              <li><kbd>{{hint.key}}</kbd> {{hint.does}}</li>
            {{/each}}
          </ul>
        </Hint>
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

      <section class="target-card" aria-label="Where Use puts a sound">
        <div class="target-card__label">
          <span>Use gives a sound to</span>
        </div>
        <p class="target-card__target" data-test-sound-target>{{if
            @targetName
            @targetName
            "Track 1"
          }}
          <span><Icon @name="arrow" class="icon--m" />
            {{#if this.target}}
              {{#if (isLast 0 this.targets)}}
                {{this.target.label}}
              {{else}}
                <select
                  class="select target-card__select"
                  aria-label="Which sampler of {{@targetName}}"
                  data-test-sound-target-choice
                  {{on "change" this.changeTarget}}
                  {{selectOptions this.targetChoices this.target.key}}
                ></select>
              {{/if}}
            {{else}}
              <span data-test-sound-no-target>no sampler</span>
            {{/if}}</span></p>
      </section>

      <div class="sound-search" role="search">
        <Icon @name="search" />
        <input
          type="search"
          aria-label="Search the library"
          placeholder="Search the library…"
          enterkeyhint="search"
          autocomplete="off"
          value={{this.query}}
          data-test-sound-search
          {{on "input" this.onSearch}}
        />
        <kbd aria-hidden="true">/</kbd>
      </div>

      <div class="segmented" role="tablist" aria-label="Which sounds">
        {{#each TABS as |tab|}}
          <button
            type="button"
            class="btn btn--ghost btn--s"
            role="tab"
            aria-selected={{if (eq this.tab tab.id) "true" "false"}}
            data-test-sounds-tab={{tab.id}}
            {{on "click" (fn this.showTab tab.id)}}
          >{{tab.label}}{{#if (eq tab.id "project")}}
              <span
                class="segmented__count"
              >{{this.pool.length}}</span>{{/if}}</button>
        {{/each}}
      </div>

      {{#if (eq this.tab "library")}}
        {{#if this.searching}}
          <p class="sound-status" role="status" data-test-search-status>
            {{#if (eq this.searchState "loading")}}
              Searching for “{{this.query}}”…
            {{else if (eq this.searchState "error")}}
              {{this.searchError}}
              <button
                type="button"
                class="btn btn--s btn--quiet"
                data-test-search-retry
                {{on "click" this.retrySearch}}
              >Try again</button>
            {{else if this.rows.length}}
              {{this.rows.length}}{{if this.more "+"}}
              found for “{{this.query}}”
            {{else}}
              Nothing in the library has “{{this.query}}” in its name or folder.
            {{/if}}
            <button
              type="button"
              class="btn btn--s btn--quiet"
              data-test-search-clear
              {{on "click" this.clearSearch}}
            >Back to folders</button>
          </p>
        {{else}}
          <nav class="breadcrumbs" aria-label="Folder">
            <button
              type="button"
              class="icon-btn breadcrumbs__up"
              aria-label="Up one folder"
              disabled={{this.atRoot}}
              data-test-library-up
              {{on "click" this.up}}
            >
              <Icon @name="chevron" class="icon--back" />
            </button>
            <ol>
              {{#each this.crumbs as |crumb index|}}
                <li>
                  {{#if index}}<Icon @name="chevron" class="icon--s" />{{/if}}
                  <button
                    type="button"
                    class="breadcrumbs__crumb"
                    aria-current={{if (isLast index this.crumbs) "location"}}
                    data-test-library-crumb={{crumb.path}}
                    {{on "click" (fn this.open crumb.path)}}
                  >{{crumb.name}}</button>
                </li>
              {{/each}}
            </ol>
          </nav>
          {{#if (eq this.folderState "loading")}}
            <p
              class="sound-status"
              role="status"
              data-test-library-status
            >Reading the library…</p>
          {{else if (eq this.folderState "error")}}
            <p class="sound-status" role="status" data-test-library-status>
              {{this.folderError}}
              <button
                type="button"
                class="btn btn--s btn--quiet"
                data-test-library-retry
                {{on "click" this.retryFolder}}
              >Try again</button>
            </p>
          {{else if this.rows.length}}{{else}}
            <p class="sound-status" role="status" data-test-library-status>This
              folder is empty.</p>
          {{/if}}
        {{/if}}
      {{else if (eq this.tab "mine")}}
        <div class="sound-pool-actions">
          <label class="btn btn--s sound-pool-actions__add">
            <span>Add audio file</span>
            <input
              type="file"
              class="sr-only"
              accept="audio/*,.wav,.mp3,.m4a,.aac,.flac,.ogg,.oga,.aif,.aiff"
              data-test-shelf-add-file
              {{on "change" this.pickFile}}
            />
          </label>
        </div>
        {{#unless this.rows.length}}
          <p class="sound-status" role="status" data-test-shelf-empty>You have
            added no sounds yet.</p>
        {{/unless}}
      {{/if}}

      {{#if this.notice}}
        <p
          class="sound-pool-notice"
          role="status"
          data-test-pool-notice
        >{{this.notice}}</p>
      {{/if}}

      {{#if this.renaming}}
        <form
          class="sound-rename"
          aria-label="Rename {{this.renaming}}"
          data-test-sound-rename
          {{on "submit" this.commitRename}}
        >
          <label>
            <span>Name of ‘{{this.renaming}}’</span>
            <input
              type="text"
              class="sound-rename__field"
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
              value={{this.renameText}}
              aria-invalid={{if this.renameProblem "true"}}
              data-test-sound-rename-field
              {{focusNow}}
              {{on "input" this.onRenameInput}}
              {{on "keydown" this.onRenameKey}}
            />
          </label>
          {{#if this.renameProblem}}
            <p
              class="sound-rename__problem"
              role="status"
            >{{this.renameProblem}}</p>
          {{else if this.renameScripts}}
            <p
              class="sound-rename__problem"
              role="status"
              data-test-rename-scripts
            >
              {{this.renameWhere}}
              {{if (eq this.renameScripts 1) "names" "name"}}
              it in
              {{if (eq this.renameScripts 1) "its script" "their scripts"}}:
              renaming changes
              {{if (eq this.renameScripts 1) "that script" "those scripts"}}
              too.</p>
          {{/if}}
          <div class="sound-rename__actions">
            <button
              type="submit"
              class="btn btn--s btn--solid"
              disabled={{if this.canRename false true}}
              data-test-sound-rename-commit
            >{{#if this.renameScripts}}Rename and update
                {{this.renameScripts}}
                {{if
                  (eq this.renameScripts 1)
                  "script"
                  "scripts"
                }}{{else}}Rename{{/if}}</button>
            <button
              type="button"
              class="btn btn--s btn--quiet"
              data-test-sound-rename-cancel
              {{on "click" this.cancelRename}}
            >Cancel</button>
          </div>
        </form>
      {{/if}}

      {{#if this.removing}}
        <div
          class="sound-rename"
          role="alertdialog"
          aria-label="Remove {{this.removing}}"
          data-test-sound-remove
        >
          <p class="sound-rename__problem">‘{{this.removing}}’ is in use. The
            samplers that play it will have no sound until they are given
            another. Undo brings it back.</p>
          <div class="sound-rename__actions">
            <button
              type="button"
              class="btn btn--s btn--solid"
              data-test-sound-remove-confirm
              {{on "click" this.confirmRemove}}
            >Remove it</button>
            <button
              type="button"
              class="btn btn--s btn--quiet"
              data-test-sound-remove-cancel
              {{on "click" this.cancelRemove}}
            >Cancel</button>
          </div>
        </div>
      {{/if}}

      {{! template-lint-disable no-invalid-interactive }}
      <ul
        class="sound-list scroll-y"
        aria-label={{if
          (eq this.tab "project")
          "Sounds in this project"
          (if (eq this.tab "mine") "My sounds" "Library")
        }}
        data-test-sound-list
        {{on "keydown" this.onListKey}}
      >
        {{#each this.rows key="id" as |row index|}}
          {{#if row.folder}}
            <li
              class="sound-row"
              data-selected={{if (eq index this.selected) "true"}}
              data-test-sound-row={{row.name}}
              {{keepInView (eq index this.selected)}}
            >
              <button
                type="button"
                class="sound-row__name sound-row__name--folder"
                data-test-sound-folder={{row.name}}
                {{on "click" (fn this.activate row index)}}
                {{on "focus" (fn this.select index)}}
              >
                <span class="truncate">{{row.name}}</span>
                <Icon @name="chevron" class="icon--m sound-row__chevron" />
              </button>
            </li>
          {{else}}
            <li
              class="sound-row sound-row--sound"
              data-selected={{if (eq index this.selected) "true"}}
              data-current={{if
                (eq row.inProject this.target.sound.key)
                (if row.inProject "true")
              }}
              data-state={{if row.entry row.entry.state (this.hearState row)}}
              data-test-sound-row={{row.name}}
              {{keepInView (eq index this.selected)}}
            >
              <button
                type="button"
                class="sound-row__play"
                aria-label="{{if
                  (this.isHearing row)
                  'Stop'
                  'Hear'
                }} {{row.name}}"
                aria-pressed={{if (this.isHearing row) "true" "false"}}
                data-test-sound-hear={{row.name}}
                {{on "click" (fn this.hear row index)}}
                {{on "focus" (fn this.select index)}}
              >
                <span><svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    {{#if (eq (this.hearState row) "loading")}}
                      {{! on its way: said here, in the button's own box, so nothing beside it moves }}
                      <path
                        d="M0.5 4 H2.5 V6 H0.5 Z M4 4 H6 V6 H4 Z M7.5 4 H9.5 V6 H7.5 Z"
                        data-test-sound-loading
                      />
                    {{else if (this.isHearing row)}}
                      <path d="M1.5 1.5 H8.5 V8.5 H1.5 Z" />
                    {{else}}
                      <path d="M2.6 0.8 L9.2 5 L2.6 9.2 Z" />
                    {{/if}}
                  </svg></span>
              </button>
              <span class="sound-row__text">
                <span class="sound-row__title truncate">{{row.name}}</span>
                <span
                  class="sound-row__detail truncate"
                  title={{row.usedFull}}
                  data-test-sound-detail
                >
                  {{#if (this.failure row)}}
                    <b data-test-sound-failed>failed:</b>
                    {{this.failure row}}
                  {{else if row.entry}}
                    {{#if (eq row.entry.state "ready")}}
                      {{seconds row.entry.duration}}
                    {{else if (eq row.entry.state "missing")}}
                      <b data-test-sound-missing>missing file</b>
                    {{else if (eq row.entry.state "error")}}
                      <b data-test-sound-failed>failed to load</b>
                    {{else}}
                      loading…
                    {{/if}}
                    ·
                    {{from row.entry}}
                    ·
                    {{#if row.usedBy}}in
                      {{row.usedBy}}{{else}}<i
                        data-test-sound-unused
                      >unused</i>{{/if}}
                  {{else}}
                    {{row.detail}}
                    {{#if row.inProject}}
                      {{#if row.detail}}·{{/if}}
                      in project as ‘{{row.inProject}}’{{#if row.usedBy}}
                        · in
                        {{row.usedBy}}{{/if}}
                    {{/if}}
                  {{/if}}
                </span>
              </span>
              {{! one fixed place for what a row may need besides Hear and Use: add, try again, supply the file }}
              <span class="sound-row__slot">
                {{#if row.entry}}
                  {{#if (eq row.entry.state "missing")}}
                    <label
                      class="btn btn--s btn--quiet sound-row__add"
                      title="Supply the file again: it is not in this browser"
                    >
                      <span>Supply</span>
                      <input
                        type="file"
                        class="sr-only"
                        accept="audio/*,.wav,.mp3,.m4a,.aac,.flac,.ogg,.oga,.aif,.aiff"
                        data-test-sound-supply={{row.name}}
                        {{on "change" (fn this.supply row.name)}}
                      />
                    </label>
                  {{else if (eq row.entry.state "error")}}
                    <button
                      type="button"
                      class="btn btn--s btn--quiet sound-row__add"
                      data-test-sound-retry={{row.name}}
                      {{on "click" (fn this.audio.retrySound row.name)}}
                    >Retry</button>
                  {{/if}}
                {{else if (this.failure row)}}
                  <button
                    type="button"
                    class="btn btn--s btn--quiet sound-row__add"
                    data-test-sound-retry={{row.name}}
                    {{on "click" (fn this.hear row index)}}
                  >Retry</button>
                {{else}}
                  {{#unless row.inProject}}
                    <button
                      type="button"
                      class="btn btn--s btn--quiet sound-row__add"
                      aria-label="Add {{row.name}} to the project"
                      title="Add to the project, without giving it to a sampler"
                      data-test-sound-add={{row.name}}
                      {{on "click" (fn this.add row index)}}
                    >+</button>
                  {{/unless}}
                {{/if}}
              </span>
              <button
                type="button"
                class="btn btn--solid btn--s sound-row__use"
                aria-label="Use {{row.name}} for {{if
                  this.target
                  this.target.label
                  'the sampler'
                }}"
                title={{unless
                  this.target
                  "The selected track has no sampler to give a sound to"
                }}
                disabled={{if this.target false true}}
                data-test-sound-use={{row.name}}
                {{on "click" (fn this.use row index)}}
              >Use</button>
              {{#if row.entry}}
                <PopupMenu
                  class="sound-row__menu"
                  @label="{{row.name}} menu"
                  @items={{this.menuItems row.entry}}
                  @open={{this.isMenuOpen row.name}}
                  @onOpenChange={{fn this.setMenu row.name}}
                />
              {{/if}}
            </li>
          {{/if}}
        {{/each}}
        {{#if this.searching}}
          {{#if this.more}}
            <li class="sound-row sound-row--more">
              <button
                type="button"
                class="btn btn--s btn--quiet"
                data-test-search-more
                {{on "click" this.moreResults}}
              >More results</button>
            </li>
          {{/if}}
        {{/if}}
      </ul>
    </aside>
  </template>
}

/** Where a sound is used, shortly: "T1, T3" (and "Main" for the project script). */
function used(entry: PoolEntry): string {
  return entry.uses
    .map((use) =>
      use.label
        .replace(/^Track (\d+)$/, 'T$1')
        .replace(/^Main output$/, 'Main'),
    )
    .join(', ');
}

/** ...and in full, for the row's tooltip. */
function usedFull(entry: PoolEntry): string {
  return entry.uses.length > 0
    ? `Used by ${entry.uses.map((use) => use.label).join(', ')}`
    : 'Not used by any track';
}

function from(entry: PoolEntry): string {
  return FROM[entry.from];
}
