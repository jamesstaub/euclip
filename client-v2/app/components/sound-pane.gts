import Component from '@glimmer/component';
import { service } from '@ember/service';
import ControlsPane from 'client-v2/components/controls-pane';
import SourcePane from 'client-v2/components/source-pane';
import type AudioService from 'client-v2/services/audio';

export interface SoundPaneSignature {
  Element: HTMLElement;
  Args: {
    /** a track's id */
    scopeId: string;
    /** the track's name, for accessible names */
    label: string;
  };
}

/**
 * The "sound" view of a track: everything that sets how it sounds, in one place: the source's editor
 * (a sampler's waveform, a synth's keyboard and scope, with the source's controls) and every other node's controls (the
 * processors), side by side where the footer is wide and one under the other where it is not. Each
 * column scrolls by itself, so the editor stays in view while the controls are scrolled.
 *
 * A track whose script declares no source editor has the processors alone, under a line that says so.
 */
export default class SoundPane extends Component<SoundPaneSignature> {
  @service declare audio: AudioService;

  get hasSource(): boolean {
    return this.audio.sources(this.args.scopeId).length > 0;
  }

  <template>
    <section
      class="footer-pane sound-pane {{if this.hasSource 'sound-pane--source'}}"
      aria-label="{{@label}} sound"
      data-test-pane="sound"
      ...attributes
    >
      <div class="sound-pane__layout">
        <div class="sound-pane__columns">
          {{#if this.hasSource}}
            <div class="sound-pane__source" data-test-sound-source>
              <SourcePane @scopeId={{@scopeId}} @label={{@label}} />
            </div>
          {{/if}}
          <div
            class="sound-pane__processors scroll-y scroll--on-yellow"
            data-test-sound-processors
          >
            {{#unless this.hasSource}}
              {{! (it says how to declare one, behind its "?") }}
              <SourcePane @scopeId={{@scopeId}} @label={{@label}} />
            {{/unless}}
            <ControlsPane @scopeId={{@scopeId}} @heading="Processors" />
          </div>
        </div>
      </div>
    </section>
  </template>
}
