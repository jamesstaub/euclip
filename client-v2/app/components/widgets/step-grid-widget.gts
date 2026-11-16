import Component from '@glimmer/component';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import type { StepGridView } from 'client-v2/audio/runner';
import type AudioService from 'client-v2/services/audio';

function pressed(value: number): 'true' | 'false' {
  return value !== 0 ? 'true' : 'false';
}

function is(a: number, b: number | null): boolean {
  return a === b;
}

/** A step that holds more than on or off shows what it holds. */
function shown(value: number): string {
  return value === 0 || value === 1
    ? ''
    : String(Math.round(value * 100) / 100);
}

function stepLabel(index: number, value: number): string {
  const state = value === 0 ? 'off' : value === 1 ? 'on' : `value ${value}`;
  return `Step ${index + 1}, ${state}`;
}

export interface StepGridWidgetSignature {
  Element: HTMLDivElement;
  Args: {
    /** the scope whose script declared it */
    scopeId: string;
    control: StepGridView;
  };
}

/**
 * The `step grid` widget: a declared step grid as a grid of step buttons, as many as the sequence has.
 * Pressing a step switches it off, or back on to what it held. How the grid wraps is in
 * styles/step-grid.css.
 */
export default class StepGridWidget extends Component<StepGridWidgetSignature> {
  @service declare audio: AudioService;

  toggle = (index: number): void =>
    this.audio.toggleStep(this.args.scopeId, this.args.control.name, index);

  <template>
    <div
      class="step-grid"
      role="group"
      aria-label="{{@control.label}} steps"
      data-sequence={{@control.name}}
      data-stored={{if @control.stored "true"}}
      data-test-step-grid={{@control.name}}
      ...attributes
    >
      {{#each @control.steps as |value index|}}
        <button
          type="button"
          class="step
            {{if (is index @control.playhead) 'step--current'}}
            {{if (shown value) 'step--valued'}}"
          aria-pressed={{pressed value}}
          aria-label={{stepLabel index value}}
          data-test-step={{index}}
          {{on "click" (fn this.toggle index)}}
        >{{shown value}}</button>
      {{/each}}
    </div>
  </template>
}
