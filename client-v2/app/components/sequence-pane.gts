import Component from '@glimmer/component';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import type { StepGridView } from 'client-v2/audio/runner';
import { stepGridWidget } from 'client-v2/controls/registry';
import Icon from 'client-v2/components/icon';
import Hint from 'client-v2/components/ui/hint';
import type AudioService from 'client-v2/services/audio';
import type ViewService from 'client-v2/services/view';

function countOf(grid: StepGridView): string {
  const on = grid.steps.filter((value) => value !== 0).length;
  return `${on} of ${grid.steps.length} steps on`;
}

const Grid = stepGridWidget().component;

export interface SequencePaneSignature {
  Element: HTMLElement;
  Args: {
    scopeId: string;
    /** the track's name, for accessible names */
    label: string;
  };
}

/**
 * The "sequence" pane: every step grid the track's script declares, each with its grid. A pattern
 * edited here (or in the track's row) is stored in the project; Reset forgets it, and the steps written
 * in the script apply again.
 */
export default class SequencePane extends Component<SequencePaneSignature> {
  @service declare audio: AudioService;
  @service declare view: ViewService;

  get stepGrids(): StepGridView[] {
    return this.audio.stepGrids(this.args.scopeId);
  }

  reset = (grid: StepGridView): void =>
    this.audio.resetControl(this.args.scopeId, grid.key);

  showInScript = (grid: StepGridView): void => {
    if (grid.line !== undefined) {
      this.view.showInScript(this.args.scopeId, grid.line);
    }
  };

  isLinked = (grid: StepGridView): boolean => {
    const linked = this.view.linked;
    return (
      linked !== null &&
      linked.scopeId === this.args.scopeId &&
      linked.line === grid.line
    );
  };

  <template>
    <section
      class="footer-pane"
      aria-label="{{@label}} sequences"
      data-test-pane="sequence"
      ...attributes
    >
      <h3 class="pane-heading">
        <span>Sequences</span>
        <Hint @label="About step grids" data-test-sequence-hint>
          <p>A grid appears for each
            <code>stepGrid('name')</code>
            line in the script, placed after the
            <code>__.transport.sequence('name', …)</code>
            it belongs to.</p>
          <p>The steps written in the script are the default. A pattern edited
            here, or in the track’s row, is kept in the project; Reset goes back
            to the script’s.</p>
        </Hint>
      </h3>
      {{#each this.stepGrids key="key" as |grid|}}
        <div class="sequence-card" data-test-sequence={{grid.name}}>
          <p class="sequence-card__head">
            <b class="truncate">{{grid.label}}</b>
            <span>{{countOf grid}}</span>
            {{#if grid.disabled}}
              <span data-test-sequence-disabled>stopped by an error</span>
            {{/if}}
            {{#if grid.stored}}
              <button
                type="button"
                class="btn btn--s btn--on-yellow"
                aria-label="Reset {{grid.label}} to the script's pattern"
                data-test-steps-reset
                {{on "click" (fn this.reset grid)}}
              >Reset</button>
            {{/if}}
            {{#if grid.line}}
              <button
                type="button"
                class="btn btn--s btn--ghost btn--on-yellow sequence-card__code"
                aria-label="Show {{grid.label}} in the script"
                title="Show in script"
                data-test-show-in-script
                {{on "click" (fn this.showInScript grid)}}
              ><Icon @name="code" /></button>
            {{/if}}
          </p>
          <Grid
            @scopeId={{@scopeId}}
            @control={{grid}}
            data-linked={{if (this.isLinked grid) "true"}}
          />
        </div>
      {{else}}
        <p class="pane-empty" data-test-pane-empty>This script declares no step
          grid.</p>
      {{/each}}
    </section>
  </template>
}
