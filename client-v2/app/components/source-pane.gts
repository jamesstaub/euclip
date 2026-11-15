import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { waitForPromise } from '@ember/test-waiters';
import type { ComponentLike } from '@glint/template';
import type { WaveformView } from 'client-v2/audio/runner';
import {
  waveformWidget,
  type WaveformWidgetSignature,
} from 'client-v2/controls/registry';
import type AudioService from 'client-v2/services/audio';

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
 * The "source" pane: a waveform editor for every `waveform(...)` the track's script declares. The editor
 * itself (waveform/editor.gts and what it draws with) is loaded the first time there is one to show.
 */
export default class SourcePane extends Component<SourcePaneSignature> {
  @service declare audio: AudioService;

  @tracked Editor: ComponentLike<WaveformWidgetSignature> | undefined;
  @tracked failed = false;
  #loading = false;

  get waveforms(): WaveformView[] {
    const waveforms = this.audio.waveforms(this.args.scopeId);
    if (waveforms.length > 0) this.#load();
    return waveforms;
  }

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
      class="footer-pane source-pane"
      aria-label="{{@label}} source"
      data-test-pane="source"
      ...attributes
    >
      <h3 class="pane-heading">Source</h3>
      {{#each this.waveforms key="key" as |waveform|}}
        {{#if this.Editor}}
          <this.Editor @scopeId={{@scopeId}} @waveform={{waveform}} />
        {{else if this.failed}}
          <p class="pane-empty" role="alert">The waveform editor could not be
            loaded. Reload the page to try again.</p>
        {{else}}
          <p class="pane-empty" data-test-waveform-loading>Loading the waveform
            editor…</p>
        {{/if}}
      {{else}}
        <p class="pane-empty" data-test-pane-empty>This script declares no
          waveform. One line, placed after the chain, shows a sampler’s sound
          here with its start, end, loop points and slices:
          <code>waveform('#sampler')</code>. Press Script to add it.</p>
      {{/each}}
    </section>
  </template>
}
