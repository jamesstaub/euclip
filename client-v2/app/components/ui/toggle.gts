import type { TOC } from '@ember/component/template-only';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';

function not(value: boolean): boolean {
  return !value;
}

function where(effective: boolean | null | undefined): string | undefined {
  return effective === null || effective === undefined
    ? undefined
    : effective
      ? 'on'
      : 'off';
}

export interface ToggleSignature {
  Element: HTMLButtonElement;
  Args: {
    checked: boolean;
    label: string;
    /** where the parameter really is, when code has moved it away from `checked` */
    effective?: boolean | null;
    onChange: (checked: boolean) => void;
  };
}

/** An on/off switch: a button with the role of a switch, so Space and Enter work it. */
const Toggle: TOC<ToggleSignature> = <template>
  <button
    type="button"
    class="toggle"
    role="switch"
    aria-checked={{if @checked "true" "false"}}
    aria-label={{@label}}
    data-effective={{where @effective}}
    data-test-toggle
    ...attributes
    {{on "click" (fn @onChange (not @checked))}}
  >
    <span class="toggle__track"><span class="toggle__handle"></span></span>
    <span class="toggle__text">{{if @checked "on" "off"}}</span>
  </button>
</template>;

export default Toggle;
