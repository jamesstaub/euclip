import Component from '@glimmer/component';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import StepGrid from 'client-v2/components/step-grid';
import type { SequenceView } from 'client-v2/audio/runner';
import type AudioService from 'client-v2/services/audio';

function countOf(sequence: SequenceView): string {
  const on = sequence.steps.filter((value) => value !== 0).length;
  return `${on} of ${sequence.steps.length} steps on`;
}

export interface SequencePaneSignature {
  Element: HTMLElement;
  Args: {
    scopeId: string;
    /** the track's name, for accessible names */
    label: string;
  };
}

/**
 * The "sequence" pane: every named sequence the track's script makes, each with its grid. A pattern
 * edited here (or in the track's row) is marked when it differs from the script's, and can be put back.
 */
export default class SequencePane extends Component<SequencePaneSignature> {
  @service declare audio: AudioService;

  get sequences(): SequenceView[] {
    return this.audio.sequences(this.args.scopeId);
  }

  toggle = (sequence: SequenceView, index: number): void =>
    this.audio.toggleStep(this.args.scopeId, sequence.name, index);

  reset = (sequence: SequenceView): void =>
    this.audio.resetSteps(this.args.scopeId, sequence.name);

  <template>
    <section
      class="footer-pane"
      aria-label="{{@label}} sequences"
      data-test-pane="sequence"
      ...attributes
    >
      <h3 class="pane-heading">Sequences</h3>
      {{#each this.sequences key="name" as |sequence|}}
        <div class="sequence-card" data-test-sequence={{sequence.name}}>
          <p class="sequence-card__head">
            <b class="truncate">{{sequence.name}}</b>
            <span>{{countOf sequence}}</span>
            {{#if sequence.disabled}}
              <span data-test-sequence-disabled>stopped by an error</span>
            {{/if}}
            {{#if sequence.overridden}}
              <button
                type="button"
                class="btn btn--s btn--on-yellow"
                aria-label="Reset {{sequence.name}} to the script's pattern"
                data-test-steps-reset
                {{on "click" (fn this.reset sequence)}}
              >Reset</button>
            {{/if}}
          </p>
          <StepGrid
            @sequence={{sequence}}
            @label={{@label}}
            @onToggle={{fn this.toggle sequence}}
          />
        </div>
      {{else}}
        <p class="pane-empty" data-test-pane-empty>This script makes no named
          sequences. A grid appears for each
          <code>__.transport.sequence('name', …)</code>.</p>
      {{/each}}
    </section>
  </template>
}
