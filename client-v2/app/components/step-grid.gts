import type { TOC } from '@ember/component/template-only';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import type { SequenceView } from 'client-v2/audio/runner';

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

export interface StepGridSignature {
  Element: HTMLDivElement;
  Args: {
    /** a named sequence of the track, as it is playing */
    sequence: SequenceView;
    /** the name of the track, for the group's accessible name */
    label: string;
    onToggle: (index: number) => void;
  };
}

/**
 * One named sequence as a grid of step buttons, as many as the sequence has. Pressing a step switches it
 * off, or back on to what it held. How the grid wraps is in styles/step-grid.css.
 */
const StepGrid: TOC<StepGridSignature> = <template>
  <div
    class="step-grid"
    role="group"
    aria-label="{{@label}} {{@sequence.name}} steps"
    data-sequence={{@sequence.name}}
    data-overridden={{if @sequence.overridden "true"}}
    data-test-step-grid={{@sequence.name}}
    ...attributes
  >
    {{#each @sequence.steps as |value index|}}
      <button
        type="button"
        class="step
          {{if (is index @sequence.playhead) 'step--current'}}
          {{if (shown value) 'step--valued'}}"
        aria-pressed={{pressed value}}
        aria-label={{stepLabel index value}}
        data-test-step={{index}}
        {{on "click" (fn @onToggle index)}}
      >{{shown value}}</button>
    {{/each}}
  </div>
</template>;

export default StepGrid;
