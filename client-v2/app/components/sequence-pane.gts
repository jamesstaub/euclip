import Component from '@glimmer/component';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import type { SequencerView } from 'client-v2/audio/runner';
import { sequencerWidget } from 'client-v2/controls/registry';
import type AudioService from 'client-v2/services/audio';

function countOf(sequencer: SequencerView): string {
  const on = sequencer.steps.filter((value) => value !== 0).length;
  return `${on} of ${sequencer.steps.length} steps on`;
}

const Grid = sequencerWidget().component;

export interface SequencePaneSignature {
  Element: HTMLElement;
  Args: {
    scopeId: string;
    /** the track's name, for accessible names */
    label: string;
  };
}

/**
 * The "sequence" pane: every sequencer the track's script declares, each with its grid. A pattern
 * edited here (or in the track's row) is stored in the project; Reset forgets it, and the steps written
 * in the script apply again.
 */
export default class SequencePane extends Component<SequencePaneSignature> {
  @service declare audio: AudioService;

  get sequencers(): SequencerView[] {
    return this.audio.sequencers(this.args.scopeId);
  }

  reset = (sequencer: SequencerView): void =>
    this.audio.resetControl(this.args.scopeId, sequencer.key);

  <template>
    <section
      class="footer-pane"
      aria-label="{{@label}} sequences"
      data-test-pane="sequence"
      ...attributes
    >
      <h3 class="pane-heading">Sequences</h3>
      {{#each this.sequencers key="key" as |sequencer|}}
        <div class="sequence-card" data-test-sequence={{sequencer.name}}>
          <p class="sequence-card__head">
            <b class="truncate">{{sequencer.label}}</b>
            <span>{{countOf sequencer}}</span>
            {{#if sequencer.disabled}}
              <span data-test-sequence-disabled>stopped by an error</span>
            {{/if}}
            {{#if sequencer.stored}}
              <button
                type="button"
                class="btn btn--s btn--on-yellow"
                aria-label="Reset {{sequencer.label}} to the script's pattern"
                data-test-steps-reset
                {{on "click" (fn this.reset sequencer)}}
              >Reset</button>
            {{/if}}
          </p>
          <Grid @scopeId={{@scopeId}} @control={{sequencer}} />
        </div>
      {{else}}
        <p class="pane-empty" data-test-pane-empty>This script declares no
          sequencer. A grid appears for each
          <code>sequencer('name')</code>
          line placed after the
          <code>__.transport.sequence('name', …)</code>
          it belongs to.</p>
      {{/each}}
    </section>
  </template>
}
