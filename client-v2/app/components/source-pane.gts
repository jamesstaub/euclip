import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import { waitForPromise } from '@ember/test-waiters';
import type { ComponentLike } from '@glint/template';
import type { WaveformView } from 'client-v2/audio/runner';
import {
  waveformWidget,
  type WaveformWidgetSignature,
} from 'client-v2/controls/registry';
import type AudioService from 'client-v2/services/audio';
import type ViewService from 'client-v2/services/view';

function eq(a: unknown, b: unknown): boolean {
  return a === b;
}

export interface SourcePaneSignature {
  Element: HTMLElement;
  Args: {
    /** a track's id */
    scopeId: string;
    /** the track's name, for accessible names */
    label: string;
  };
}

/**
 * The "source" pane: the waveform editors the track's script declares with `waveform(...)`, one at a
 * time. A script with several samplers gets a list of them down the left (each by its label, else by
 * the selector that names it: #kick); in a narrow footer, where a column would cost too much width,
 * the same choice is a picker in the editor's own bar. Which one is showing belongs to how the track is
 * being looked at (services/view.ts), not to the project: it is not a step to undo. When the one chosen
 * goes from the script, the first is shown.
 *
 * The pane is laid out to fit the footer: the editor's picture takes what height is left after its
 * bars and its numbers, so those are never pushed out of sight (styles/waveform.css). The editor itself
 * (waveform/editor.gts and what it draws with) is loaded the first time there is one to show.
 */
export default class SourcePane extends Component<SourcePaneSignature> {
  @service declare audio: AudioService;
  @service declare view: ViewService;

  @tracked Editor: ComponentLike<WaveformWidgetSignature> | undefined;
  @tracked failed = false;
  #loading = false;

  get waveforms(): WaveformView[] {
    const waveforms = this.audio.waveforms(this.args.scopeId);
    if (waveforms.length > 0) this.#load();
    return waveforms;
  }

  /** The one showing: the one chosen for this track if the script still has it, else the first. */
  get shown(): WaveformView | undefined {
    const waveforms = this.waveforms;
    const chosen = this.view.chosenWaveform(this.args.scopeId);
    return (
      waveforms.find((waveform) => waveform.key === chosen) ?? waveforms[0]
    );
  }

  get several(): boolean {
    return this.waveforms.length > 1;
  }

  choose = (key: string): void =>
    this.view.chooseWaveform(this.args.scopeId, key);

  /** Up and down move along the list, as in any vertical tab list. */
  onTabKey = (event: KeyboardEvent): void => {
    const step =
      event.key === 'ArrowDown' || event.key === 'ArrowRight'
        ? 1
        : event.key === 'ArrowUp' || event.key === 'ArrowLeft'
          ? -1
          : 0;
    if (step === 0) return;
    event.preventDefault();
    const waveforms = this.waveforms;
    const at = waveforms.findIndex(
      (waveform) => waveform.key === this.shown?.key,
    );
    const next = waveforms[(at + step + waveforms.length) % waveforms.length];
    if (!next) return;
    this.choose(next.key);
    (event.currentTarget as HTMLElement)
      .querySelectorAll<HTMLElement>('[role="tab"]')
      [waveforms.indexOf(next)]?.focus();
  };

  #load(): void {
    if (this.#loading) return;
    this.#loading = true;
    void waitForPromise(waveformWidget().load()).then(
      (Editor) => {
        this.Editor = Editor;
      },
      () => {
        this.failed = true;
      },
    );
  }

  <template>
    <section
      class="footer-pane source-pane {{if this.shown 'source-pane--filled'}}"
      aria-label="{{@label}} source"
      data-test-pane="source"
      ...attributes
    >
      <h3 class="pane-heading source-pane__heading">Source</h3>
      {{#if this.shown}}
        <div class="source-pane__body">
          {{#if this.several}}
            {{! template-lint-disable no-invalid-interactive }}
            <div
              class="source-tabs"
              role="tablist"
              aria-orientation="vertical"
              aria-label="Waveforms of {{@label}}"
              data-test-waveform-tabs
              {{on "keydown" this.onTabKey}}
            >
              {{#each this.waveforms key="key" as |waveform|}}
                <button
                  type="button"
                  class="source-tabs__tab truncate"
                  role="tab"
                  aria-selected={{if
                    (eq waveform.key this.shown.key)
                    "true"
                    "false"
                  }}
                  tabindex={{if (eq waveform.key this.shown.key) "0" "-1"}}
                  title={{waveform.label}}
                  data-test-waveform-tab={{waveform.nodeId}}
                  {{on "click" (fn this.choose waveform.key)}}
                >{{waveform.label}}</button>
              {{/each}}
            </div>
          {{/if}}
          {{#if this.Editor}}
            {{! keyed by the waveform, so each editor keeps its own zoom and nothing of another's }}
            {{#each (list this.shown) key="key" as |waveform|}}
              <this.Editor
                @scopeId={{@scopeId}}
                @waveform={{waveform}}
                @others={{this.waveforms}}
                @onChoose={{this.choose}}
              />
            {{/each}}
          {{else if this.failed}}
            <p class="pane-empty" role="alert">The waveform editor could not be
              loaded. Reload the page to try again.</p>
          {{else}}
            <p class="pane-empty" data-test-waveform-loading>Loading the
              waveform editor…</p>
          {{/if}}
        </div>
      {{else}}
        <p class="pane-empty" data-test-pane-empty>This script declares no
          waveform. One line, placed after the chain, shows a sampler’s sound
          here with its start, end, loop points and slices:
          <code>waveform('#sampler')</code>. Press Script to add it.</p>
      {{/if}}
    </section>
  </template>
}

function list<T>(item: T): T[] {
  return [item];
}
