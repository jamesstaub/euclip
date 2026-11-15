import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import Icon from 'client-v2/components/icon';
import type { WaveformView } from 'client-v2/audio/runner';
import type AudioService from 'client-v2/services/audio';
import type { PoolEntry } from 'client-v2/services/audio';

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

/**
 * Sidebar region: the sound browser. "All sounds" is still placeholder content (a library to browse is
 * to come). "In this project" is real: the project's pool, with each sound's length; a sound can be
 * heard, used for the selected track's sampler (the one its script declares a `waveform` for), and
 * audio files can be added from the device, by the button or by dropping them here.
 */
export default class SoundBrowser extends Component<SoundBrowserSignature> {
  @service declare audio: AudioService;

  @tracked tab: 'all' | 'project' = 'all';
  @tracked notice: string | null = null;
  @tracked dropping = false;

  get pool(): PoolEntry[] {
    return this.audio.pool();
  }

  /** The sampler of the selected track that a sound would go to: the first it declares a waveform for. */
  get target(): WaveformView | undefined {
    const scopeId = this.args.scopeId;
    return scopeId === undefined
      ? undefined
      : this.audio.waveforms(scopeId).find((waveform) => waveform.choosable);
  }

  showAll = (): void => {
    this.tab = 'all';
  };

  showProject = (): void => {
    this.tab = 'project';
  };

  use = (entry: PoolEntry): void => {
    const target = this.target;
    if (target && this.args.scopeId !== undefined) {
      this.audio.setControl(this.args.scopeId, target.soundKey, entry.name);
    }
  };

  pickFile = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) void this.addFile(file);
  };

  async addFile(file: File): Promise<void> {
    this.tab = 'project';
    this.notice = `Adding “${file.name}”…`;
    const result = await this.audio.addFile(file);
    this.notice =
      typeof result.error === 'string'
        ? result.error
        : 'name' in result
          ? `Added as '${result.name}'.`
          : null;
  }

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

  <template>
    {{! template-lint-disable no-invalid-interactive }}
    {{! an audio file can be dropped anywhere on the sidebar }}
    <aside
      class="sound-browser {{if this.dropping 'sound-browser--dropping'}}"
      aria-label="Sounds"
      data-test-sound-browser
      ...attributes
      {{on "dragover" this.onDragOver}}
      {{on "dragleave" this.onDragLeave}}
      {{on "drop" this.onDrop}}
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
        <p class="target-card__target" data-test-sound-target>{{if
            @targetName
            @targetName
            "Track 1"
          }}
          <span><Icon @name="arrow" class="icon--m" />
            {{if this.target this.target.label "Sampler"}}</span></p>
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
          aria-pressed={{if (eq this.tab "all") "true" "false"}}
          data-test-sounds-all
          {{on "click" this.showAll}}
        >All sounds</button>
        <button
          type="button"
          class="btn btn--ghost btn--s"
          aria-pressed={{if (eq this.tab "project") "true" "false"}}
          data-test-sounds-project
          {{on "click" this.showProject}}
        >In this project
          <b>{{this.pool.length}}</b></button>
      </div>

      {{#if (eq this.tab "project")}}
        <div class="sound-pool-actions">
          <label class="btn btn--s sound-pool-actions__add">
            <span>Add audio file</span>
            <input
              type="file"
              class="sr-only"
              accept="audio/*,.wav,.mp3,.m4a,.aac,.flac,.ogg,.oga,.aif,.aiff"
              data-test-pool-add-file
              {{on "change" this.pickFile}}
            />
          </label>
          <span>or drop one here</span>
        </div>
        {{#if this.notice}}
          <p
            class="sound-pool-notice"
            role="status"
            data-test-pool-notice
          >{{this.notice}}</p>
        {{/if}}
        <ul
          class="sound-list scroll-y"
          aria-label="Sounds in this project"
          data-test-pool-list
        >
          {{#each this.pool key="name" as |entry|}}
            <li
              class="sound-row sound-row--pool"
              data-current={{if (eq entry.name this.target.sound.key) "true"}}
              data-test-pool-row={{entry.name}}
            >
              <span class="sound-row__name sound-row__name--pool">
                <span class="truncate">{{entry.name}}</span>
              </span>
              <span class="pool-row__length">{{if
                  (eq entry.state "ready")
                  (seconds entry.duration)
                  (if (eq entry.state "error") "missing" "loading")
                }}{{#if entry.added}} · added{{/if}}</span>
              <button
                type="button"
                class="btn btn--solid btn--s pool-row__use"
                aria-label="Use {{entry.name}} for {{if
                  this.target
                  this.target.label
                  'the sampler'
                }}"
                title={{unless
                  this.target
                  "The selected track's script declares no waveform('#sampler'), so there is no sampler to give it to"
                }}
                disabled={{if this.target false true}}
                data-test-pool-use={{entry.name}}
                {{on "click" (fn this.use entry)}}
              >Use</button>
            </li>
          {{/each}}
        </ul>
      {{else}}

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

        <ul
          class="sound-list scroll-y"
          aria-label="Sounds"
          data-test-sound-list
        >
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

      {{/if}}

      <p class="sound-hints" aria-hidden="true">
        {{#each HINTS as |hint|}}
          <span><kbd>{{hint.key}}</kbd>{{hint.does}}</span>
        {{/each}}
      </p>
    </aside>
  </template>
}
