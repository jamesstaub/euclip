import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import { waitForPromise } from '@ember/test-waiters';
import type { ComponentLike } from '@glint/template';
import SourceControls from 'client-v2/components/source-controls';
import Hint from 'client-v2/components/ui/hint';
import type { SourceView } from 'client-v2/audio/runner';
import {
  synthWidget,
  waveformWidget,
  type SynthWidgetSignature,
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
 * The "source" pane: the editors the track's script declares for its sources, one at a time: a sampler's
 * waveform (`waveform(...)`) or an oscillator's or synth macro's scope, keyboard and controls
 * (`synth(...)`). A script with several sources gets a list of them down the left (each by its label,
 * else by the selector that names it: #kick), samplers and synths together; in a narrow footer, where a column would cost too much width,
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
  @tracked SynthEditor: ComponentLike<SynthWidgetSignature> | undefined;
  @tracked failed = false;
  #loading = new Set<string>();

  /** Every source editor the script declares, samplers and synths together, in the order it declared them. */
  get waveforms(): SourceView[] {
    const sources = this.audio.sources(this.args.scopeId);
    for (const source of sources) this.#load(source.kind);
    return sources;
  }

  /** The one showing: the one chosen for this track if the script still has it, else the first. */
  get shown(): SourceView | undefined {
    const sources = this.waveforms;
    const chosen = this.view.chosenWaveform(this.args.scopeId);
    return sources.find((source) => source.key === chosen) ?? sources[0];
  }

  get shownWaveform(): Extract<SourceView, { kind: 'waveform' }> | undefined {
    const shown = this.shown;
    return shown?.kind === 'waveform' ? shown : undefined;
  }

  get shownSynth(): Extract<SourceView, { kind: 'synth' }> | undefined {
    const shown = this.shown;
    return shown?.kind === 'synth' ? shown : undefined;
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

  #load(kind: SourceView['kind']): void {
    if (this.#loading.has(kind)) return;
    this.#loading.add(kind);
    if (kind === 'waveform') {
      void waitForPromise(waveformWidget().load()).then(
        (Editor) => {
          this.Editor = Editor;
        },
        () => {
          this.failed = true;
        },
      );
    } else {
      void waitForPromise(synthWidget().load()).then(
        (Editor) => {
          this.SynthEditor = Editor;
        },
        () => {
          this.failed = true;
        },
      );
    }
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
              aria-label="Sources of {{@label}}"
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
                  data-kind={{waveform.kind}}
                  {{on "click" (fn this.choose waveform.key)}}
                >{{waveform.label}}</button>
              {{/each}}
            </div>
          {{/if}}
          {{#if this.shownSynth}}
            {{#if this.SynthEditor}}
              {{#each (list this.shownSynth) key="key" as |source|}}
                <this.SynthEditor
                  @scopeId={{@scopeId}}
                  @synth={{source.synth}}
                  @others={{this.waveforms}}
                  @onChoose={{this.choose}}
                />
              {{/each}}
            {{else if this.failed}}
              <p class="pane-empty" role="alert">The synth editor could not be
                loaded. Reload the page to try again.</p>
            {{else}}
              <p class="pane-empty" data-test-waveform-loading>Loading the synth
                editor…</p>
            {{/if}}
          {{else if this.Editor}}
            {{! keyed by the waveform, so each editor keeps its own zoom and nothing of another's }}
            {{#each (list this.shownWaveform) key="key" as |source|}}
              <div class="source-pane__editor">
                <this.Editor
                  @scopeId={{@scopeId}}
                  @waveform={{source.waveform}}
                  @others={{this.waveforms}}
                  @onChoose={{this.choose}}
                />
                <SourceControls
                  @scopeId={{@scopeId}}
                  @nodeId={{source.nodeId}}
                  @skipWaveform={{true}}
                />
              </div>
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
        <p class="pane-empty" data-test-pane-empty>
          <span>This script declares no source.</span>
          <Hint @label="About the source pane" data-test-source-hint>
            <p>One line in the script, placed after the chain, shows a sampler’s
              sound here with its start, end, loop points and slices:
              <code>waveform('#sampler')</code>. An oscillator or synth macro
              has a scope, a keyboard and its controls:
              <code>synth('#osc')</code>. Or
              <code>controls()</code>
              for all of it. Press Script to add them.</p>
            <p>A script with several sources can declare one for each; they are
              listed here to choose between.</p>
          </Hint>
        </p>
      {{/if}}
    </section>
  </template>
}

function list<T>(item: T | undefined): T[] {
  return item === undefined ? [] : [item];
}
