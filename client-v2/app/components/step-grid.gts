import type { TOC } from '@ember/component/template-only';

function pressed(value: number): 'true' | 'false' {
  return value > 0 ? 'true' : 'false';
}

function isCurrent(index: number, current: number | undefined): boolean {
  return index === current;
}

function stepLabel(index: number, value: number): string {
  return `Step ${index + 1}, ${value > 0 ? 'on' : 'off'}`;
}

export interface StepGridSignature {
  Element: HTMLDivElement;
  Args: {
    /** one value per step; 0 is off */
    steps: readonly number[];
    /** the name of the track or sequence, for the group's accessible name */
    label: string;
    /** index of the step being played, if any */
    current?: number;
  };
}

/** A sequence as a grid of step buttons. How it wraps is in styles/step-grid.css. */
const StepGrid: TOC<StepGridSignature> = <template>
  <div
    class="step-grid"
    role="group"
    aria-label="{{@label}} steps"
    data-test-step-grid
    ...attributes
  >
    {{#each @steps as |value index|}}
      <button
        type="button"
        class="step {{if (isCurrent index @current) 'step--current'}}"
        aria-pressed={{pressed value}}
        aria-label={{stepLabel index value}}
        data-test-step
      ></button>
    {{/each}}
  </div>
</template>;

export default StepGrid;
