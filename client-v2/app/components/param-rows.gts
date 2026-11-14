import type { TOC } from '@ember/component/template-only';
import Icon from 'client-v2/components/icon';

export interface ParamPlaceholder {
  name: string;
  min: number;
  max: number;
  value: number;
  unit?: string;
  /** whole numbers only (a count of steps, say) */
  whole?: boolean;
}

function stepFor(param: ParamPlaceholder): number {
  return param.whole ? 1 : (param.max - param.min) / 100;
}

export interface ParamRowsSignature {
  Element: HTMLUListElement;
  Args: {
    params: readonly ParamPlaceholder[];
  };
}

/**
 * A row per parameter: per-step toggle, name, slider, value, unit, settings. Plain native placeholders
 * in v1's arrangement; the real controls come later.
 */
const ParamRows: TOC<ParamRowsSignature> = <template>
  <ul class="param-grid" ...attributes>
    {{#each @params as |param|}}
      <li class="param-row" data-test-param={{param.name}}>
        <button
          type="button"
          class="icon-btn param-row__per-step"
          aria-label="Give {{param.name}} a value for every step"
          aria-pressed="false"
        >
          <Icon @name="multislider" />
        </button>
        <span class="param-row__name truncate">{{param.name}}</span>
        <input
          type="range"
          class="param-row__slider"
          aria-label={{param.name}}
          min={{param.min}}
          max={{param.max}}
          step={{stepFor param}}
          value={{param.value}}
        />
        <input
          type="number"
          class="param-row__value"
          aria-label="{{param.name}} value"
          inputmode="decimal"
          min={{param.min}}
          max={{param.max}}
          step="any"
          value={{param.value}}
        />
        {{#if param.unit}}
          <span class="param-row__unit">{{param.unit}}</span>
        {{/if}}
        <button
          type="button"
          class="icon-btn param-row__menu"
          aria-label="Settings for {{param.name}}"
        >⋮</button>
      </li>
    {{/each}}
  </ul>
</template>;

export default ParamRows;
