import Component from '@glimmer/component';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import type { StepGridView } from 'client-v2/audio/runner';
import { stepGridWidget } from 'client-v2/controls/registry';
import Icon from 'client-v2/components/icon';
import Hint from 'client-v2/components/ui/hint';
import Knob from 'client-v2/components/ui/knob';
import NumberEntry from 'client-v2/components/ui/number-entry';
import {
  applyGenerator,
  hitFill,
  isEdited,
  readGenerator,
} from 'client-v2/controls/generators';
import { mapping } from 'client-v2/controls/modes';
import { GRID_LENGTH_MAX } from 'client-v2/controls/script-api';
import selectOptions, {
  type SelectOption,
} from 'client-v2/modifiers/select-options';
import type AudioService from 'client-v2/services/audio';
import type ViewService from 'client-v2/services/view';

const Grid = stepGridWidget().component;

/** How many steps a grid's Length dial gives: 1 to 64. */
const LENGTH = mapping('stepped', { min: 1, max: GRID_LENGTH_MAX, step: 1 });

/**
 * The step lengths the Step menu offers, in the library's own writing of a duration: a fraction of a
 * whole note, `t` for a triplet, `d` for dotted.
 */
const STEP_LENGTHS: readonly SelectOption[] = [
  { value: '1/2', label: '1/2' },
  { value: '1/4', label: '1/4' },
  { value: '1/4t', label: '1/4 triplet' },
  { value: '1/8d', label: '1/8 dotted' },
  { value: '1/8', label: '1/8' },
  { value: '1/8t', label: '1/8 triplet' },
  { value: '1/16d', label: '1/16 dotted' },
  { value: '1/16', label: '1/16' },
  { value: '1/16t', label: '1/16 triplet' },
  { value: '1/32', label: '1/32' },
];

let shapeGestures = 0;

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

  /** Back to the script's: the pattern, the length and the step length. One step to undo. */
  reset = (grid: StepGridView): void =>
    this.audio.resetGrid(this.args.scopeId, grid.key);

  canReset = (grid: StepGridView): boolean =>
    grid.stored || grid.lengthStored || grid.stepStored;

  lengthMapping = LENGTH;

  /** The Step menu's choices: the lengths on offer, and the sequence's own when it is not one of them. */
  stepChoices = (grid: StepGridView): readonly SelectOption[] => {
    if (grid.span !== null) {
      return [{ value: '', label: `spread over ${grid.span}` }];
    }
    const now = grid.step;
    return now === null
      ? [{ value: '', label: 'the transport’s' }, ...STEP_LENGTHS]
      : STEP_LENGTHS.some((choice) => choice.value === now)
        ? STEP_LENGTHS
        : [{ value: now, label: now }, ...STEP_LENGTHS];
  };

  stepValue = (grid: StepGridView): string => grid.step ?? '';

  /** What the script says, where what is set on the grid is something else: said quietly. */
  scriptSays = (grid: StepGridView): string => {
    const says: string[] = [];
    if (grid.lengthStored && grid.steps.length !== grid.scriptLength) {
      says.push(`${grid.scriptLength} steps`);
    }
    if (grid.stepStored && grid.step !== grid.scriptStep) {
      says.push(grid.scriptStep ?? 'the transport’s step');
    }
    return says.length > 0 ? `script: ${says.join(', ')}` : '';
  };

  #lengthGesture = '';

  newLengthGesture = (): void => {
    this.#lengthGesture = `length-${++shapeGestures}`;
  };

  /**
   * The Length dial: the sequence has that many steps from now. The pattern is kept as far as it goes
   * and new steps are rests; where the generator's dials made the pattern (and no step has been
   * changed by hand since), they make it again for the new length. One step to undo for the gesture.
   */
  setLength = (grid: StepGridView, value: number): void => {
    const length = Math.round(value);
    if (length === grid.steps.length) return;
    if (this.#lengthGesture === '') this.newLengthGesture();
    const group = this.#lengthGesture;
    const scopeId = this.args.scopeId;
    this.audio.setGridShape(scopeId, grid.key, { length }, group);
    const fitted = Array.from({ length }, (_, index) => grid.steps[index] ?? 0);
    const dials = readGenerator(grid.generator, grid.steps);
    if (dials && !isEdited(dials, grid.steps)) {
      // (the same dials, held to the new length: 5 of 16 is 5 of 12)
      const refit = readGenerator({ ...dials, made: undefined }, fitted);
      if (refit) {
        const made = applyGenerator(
          refit,
          fitted,
          hitFill(false, this.audio.sources(scopeId)),
        );
        this.audio.setPattern(
          scopeId,
          grid.key,
          made.steps,
          made.generator,
          group,
        );
      }
    }
  };

  typeLength = (grid: StepGridView, typed: string): boolean => {
    const value = LENGTH.parse(typed);
    if (value === null) return false;
    this.newLengthGesture();
    this.setLength(grid, value);
    return true;
  };

  setStep = (grid: StepGridView, event: Event): void => {
    const step = (event.target as HTMLSelectElement).value;
    if (step === '' || step === grid.step) return;
    this.audio.setGridShape(this.args.scopeId, grid.key, { step });
  };

  lengthText = (grid: StepGridView): string => String(grid.steps.length);

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
      class="footer-pane sequence-pane"
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
          <Grid
            @scopeId={{@scopeId}}
            @control={{grid}}
            @generators={{true}}
            data-linked={{if (this.isLinked grid) "true"}}
          >
            <:lead>
              <span class="sequence-card__name">
                <b class="truncate">{{grid.label}}</b>
                {{#if grid.disabled}}
                  <span data-test-sequence-disabled>stopped by an error</span>
                {{/if}}
              </span>
              {{! template-lint-disable no-pointer-down-event-binding no-invalid-interactive }}
              {{! (a press or a key on the dial begins a gesture: one step to undo) }}
              <span
                class="sequence-card__shape sequence-card__length"
                data-test-grid-length
                {{on "pointerdown" this.newLengthGesture capture=true}}
                {{on "keydown" this.newLengthGesture capture=true}}
              >
                <span class="sequence-card__label">Length</span>
                <Knob
                  @value={{grid.steps.length}}
                  @mapping={{this.lengthMapping}}
                  @label="{{grid.label}} length in steps"
                  @onChange={{fn this.setLength grid}}
                />
                <NumberEntry
                  @text={{this.lengthText grid}}
                  @label="{{grid.label}} length in steps"
                  @inputmode="numeric"
                  @maxlength={{2}}
                  @onCommit={{fn this.typeLength grid}}
                />
              </span>
              <label class="sequence-card__shape sequence-card__step">
                <span class="sequence-card__label">Step</span>
                <select
                  class="select"
                  disabled={{if grid.span true false}}
                  data-test-grid-step
                  {{on "change" (fn this.setStep grid)}}
                  {{selectOptions
                    (this.stepChoices grid)
                    (this.stepValue grid)
                  }}
                ></select>
              </label>
            </:lead>
            <:trail>
              <i
                class="sequence-card__script"
                data-test-grid-script
              >{{this.scriptSays grid}}</i>
              {{#if (this.canReset grid)}}
                <button
                  type="button"
                  class="btn btn--s btn--on-yellow sequence-card__reset"
                  aria-label="Reset {{grid.label}} to the script's pattern, length and step"
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
            </:trail>
          </Grid>
        </div>
      {{else}}
        <p class="pane-empty" data-test-pane-empty>This script declares no step
          grid.</p>
      {{/each}}
    </section>
  </template>
}
