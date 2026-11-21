import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import Hint from 'client-v2/components/ui/hint';
import type { StepGridView } from 'client-v2/audio/runner';
import type AudioService from 'client-v2/services/audio';
import type ViewService from 'client-v2/services/view';

interface Cell {
  index: number;
  number: number;
  chosen: boolean;
  /** some control's lane holds a value of its own on this step */
  set: boolean;
  current: boolean;
}

export interface StepPickerSignature {
  Element: HTMLDivElement;
  Args: {
    scopeId: string;
  };
}

/**
 * Over a track's controls: which values they edit. "All steps" (the default) is each control's single
 * value; a step chosen here makes every control whose lane follows that sequence set the step's own
 * value instead (an Elektron-style lock), so turning a knob with step 5 chosen changes step 5 only. A
 * step that some control holds a value for is marked. Choosing the step again, All steps, or Escape
 * goes back. A script with several sequences that have grids gets a menu of them.
 */
export default class StepPicker extends Component<StepPickerSignature> {
  @service declare audio: AudioService;
  @service declare view: ViewService;

  /** the sequence shown when no step is chosen (the person's pick from the menu); else the first */
  @tracked picked: string | null = null;

  /** The grids whose sequences have lanes to edit. */
  get grids(): StepGridView[] {
    return this.audio
      .stepGrids(this.args.scopeId)
      .filter((grid) => this.audio.lanes(this.args.scopeId, grid.name).length);
  }

  get chosen(): { sequence: string; index: number } | null {
    const chosen = this.view.chosenStep(this.args.scopeId);
    // (a step of a sequence that is gone, or past its end, is no choice)
    const grid = chosen && this.grids.find((g) => g.name === chosen.sequence);
    return chosen && grid && chosen.index < grid.steps.length ? chosen : null;
  }

  get grid(): StepGridView | undefined {
    const name = this.chosen?.sequence ?? this.picked;
    return this.grids.find((grid) => grid.name === name) ?? this.grids[0];
  }

  get several(): boolean {
    return this.grids.length > 1;
  }

  get cells(): Cell[] {
    const grid = this.grid;
    if (!grid) return [];
    const lanes = this.audio.lanes(this.args.scopeId, grid.name);
    const chosen = this.chosen;
    return grid.steps.map((_, index) => ({
      index,
      number: index + 1,
      chosen: chosen?.sequence === grid.name && chosen.index === index,
      set: lanes.some((lane) => lane.locked[index]),
      current: grid.playhead === index,
    }));
  }

  get noneChosen(): boolean {
    return this.chosen === null;
  }

  choose = (index: number): void => {
    const grid = this.grid;
    if (!grid) return;
    const chosen = this.chosen;
    this.view.chooseStep(
      this.args.scopeId,
      chosen?.sequence === grid.name && chosen.index === index
        ? null
        : { sequence: grid.name, index },
    );
  };

  all = (): void => {
    this.view.chooseStep(this.args.scopeId, null);
  };

  pickSequence = (event: Event): void => {
    const name = (event.target as HTMLSelectElement).value;
    this.picked = name;
    if (this.chosen) this.view.chooseStep(this.args.scopeId, null);
  };

  onKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.chosen) {
      event.stopPropagation();
      this.all();
    }
  };

  isPicked = (name: string): boolean => name === this.grid?.name;

  <template>
    {{#if this.grid}}
      {{! template-lint-disable no-invalid-interactive }}
      <div
        class="step-picker"
        role="group"
        aria-label="Edit the values of"
        data-chosen={{if this.noneChosen "" "true"}}
        data-test-step-picker
        {{on "keydown" this.onKey}}
        ...attributes
      >
        <span class="step-picker__label">Edit</span>
        <button
          type="button"
          class="step-picker__all"
          aria-pressed={{if this.noneChosen "true" "false"}}
          data-test-step-picker-all
          {{on "click" this.all}}
        >All steps</button>
        {{#if this.several}}
          <select
            class="step-picker__sequence"
            aria-label="Sequence"
            data-test-step-picker-sequence
            {{on "change" this.pickSequence}}
          >
            {{#each this.grids key="name" as |grid|}}
              <option
                value={{grid.name}}
                selected={{this.isPicked grid.name}}
              >{{grid.name}}</option>
            {{/each}}
          </select>
        {{/if}}
        <Hint @label="About editing a step" data-test-step-picker-hint>
          <p>With
            <b>All steps</b>, a control sets its own value: what every step
            plays unless the step has one of its own.</p>
          <p>Choose a step and the controls set that step’s value instead: turn
            a knob with step 5 chosen and only step 5 changes. A dot marks a
            step some control holds a value for. A control’s
            <b>step</b>
            button makes its step follow the control again.</p>
          <p>Each control’s lane (its multislider button) shows every step at
            once, to paint across.</p>
        </Hint>
        <span class="step-picker__steps">
          {{#each this.cells key="index" as |cell|}}
            <button
              type="button"
              class="step-picker__step"
              aria-pressed={{if cell.chosen "true" "false"}}
              aria-label="Step {{cell.number}}"
              data-set={{if cell.set "true"}}
              data-current={{if cell.current "true"}}
              data-test-step-pick={{cell.index}}
              {{on "click" (fn this.choose cell.index)}}
            >{{cell.number}}</button>
          {{/each}}
        </span>
      </div>
    {{/if}}
  </template>
}
