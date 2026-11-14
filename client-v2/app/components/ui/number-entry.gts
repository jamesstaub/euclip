import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import { modifier } from 'ember-modifier';

const focusAndSelect = modifier<{ Element: HTMLInputElement }>((element) => {
  element.focus();
  element.select();
});

export interface NumberEntrySignature {
  Element: HTMLElement;
  Args: {
    /** the value as shown: `2 kHz`, `A4`, `-6.0 dB` */
    text: string;
    /** what the control is, for the accessible names */
    label: string;
    /** what was typed. Return false if it could not be read: the field then stays open. */
    onCommit: (text: string) => boolean;
  };
}

/**
 * A control's readout. It shows the value as text; press it to type a value instead (in whatever form
 * the control's mode reads: a number, a note name, decibels). Enter or leaving the field commits,
 * Escape gives up.
 */
export default class NumberEntry extends Component<NumberEntrySignature> {
  @tracked editing = false;
  @tracked invalid = false;

  edit = (): void => {
    this.editing = true;
    this.invalid = false;
  };

  commit = (event: Event): void => {
    if (!this.editing) return;
    const input = event.target as HTMLInputElement;
    if (input.value.trim() === '' || this.args.onCommit(input.value)) {
      this.editing = false;
    } else {
      this.invalid = true;
    }
  };

  onKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      this.commit(event);
    } else if (event.key === 'Escape') {
      event.stopPropagation(); // not the sidebar's Escape
      this.editing = false;
    }
  };

  leave = (event: Event): void => {
    // (the field also loses focus as it is removed, after Enter or Escape: nothing more to do then)
    if (!this.editing) return;
    this.commit(event);
    this.editing = false;
  };

  <template>
    {{#if this.editing}}
      <input
        type="text"
        class="number-entry number-entry--editing"
        inputmode="decimal"
        autocomplete="off"
        aria-label="{{@label}} value"
        aria-invalid={{if this.invalid "true"}}
        value={{@text}}
        data-test-number-input
        ...attributes
        {{focusAndSelect}}
        {{on "keydown" this.onKeydown}}
        {{on "blur" this.leave}}
      />
    {{else}}
      <button
        type="button"
        class="number-entry"
        aria-label="{{@label}}: {{@text}}. Type a value"
        data-test-number-entry
        ...attributes
        {{on "click" this.edit}}
      >{{@text}}</button>
    {{/if}}
  </template>
}
