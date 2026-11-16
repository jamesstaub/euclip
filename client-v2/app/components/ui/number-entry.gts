import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import { modifier } from 'ember-modifier';
import { ControlGesture, positionForKey } from 'client-v2/controls/gesture';
import type { Mapping } from 'client-v2/controls/modes';

/** How far the pointer travels, in px, for the whole of a dragged number's range. */
export const DRAG_TRAVEL_PX = 200;
let drags = 0;

/** Focus goes to the field as it appears: its text selected to be typed over, or the caret after a seed. */
const focusAndSelect = modifier<{
  Element: HTMLInputElement;
  Args: { Positional: [seeded: boolean, start: () => string] };
}>((element, [seeded, start]) => {
  // The field is given its text once, here, and never again: from now until it closes the text is the
  // person's. (Bound in the template it was written back on every change to the project, over
  // whatever had been typed or deleted.)
  element.value = start();
  element.focus({ preventScroll: true });
  if (seeded) {
    element.setSelectionRange(element.value.length, element.value.length);
  } else {
    element.select();
  }
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
    /** start with the field open (a box shown over something, to type its value) */
    open?: boolean;
    /** with `open`: what the field starts with instead of `text` (the digit that opened it) */
    initial?: string;
    /** the field has closed, by a commit or by giving up */
    onDone?: () => void;
    /** shown, but not to be changed now (a loop point while the loop is off) */
    disabled?: boolean;
    /** the keyboard a phone shows: `decimal` (the default) or `numeric` for whole numbers */
    inputmode?: 'decimal' | 'numeric' | 'text';
    /** the most characters the field takes */
    maxlength?: number;
    /** makes what is typed fit as it is typed (digits only, say): given the field's text, returns what it should be */
    sanitize?: (text: string) => string;
    /**
     * With `mapping` and `onChange`, the number is also a slider with no track: dragged along (left and
     * right), or stepped with the arrow keys, it moves through the mapping's range as a slider would.
     * A press that does not move still opens the field.
     */
    value?: number;
    mapping?: Mapping;
    /** a new value from a drag or a key. `gesture` names the drag it belongs to (one step to undo). */
    onChange?: (value: number, gesture?: string) => void;
  };
}

/**
 * A control's readout. It shows the value as text; press it to type a value instead (in whatever form
 * the control's mode reads: a number, a note name, decibels). Enter or leaving the field commits,
 * Escape gives up.
 */
export default class NumberEntry extends Component<NumberEntrySignature> {
  @tracked editing = this.args.open ?? false;
  @tracked invalid = false;

  get seeded(): boolean {
    return this.args.initial !== undefined;
  }

  /**
   * What the field starts with, noted (not tracked) at the moment it opens: the field is not to be
   * written into again when the value it shows changes under it.
   */
  #start = this.args.initial ?? this.args.text;
  start = (): string => this.#start;

  #close(): void {
    this.editing = false;
    this.args.onDone?.();
  }

  get draggable(): boolean {
    return (
      this.args.mapping !== undefined &&
      this.args.onChange !== undefined &&
      this.args.value !== undefined &&
      !this.args.disabled
    );
  }

  get position(): number {
    return this.args.mapping?.toPosition(this.args.value ?? 0) ?? 0;
  }

  #drag: string | undefined;
  /** a drag has just ended on the number: the click that ends it is not a press */
  #dragged = false;

  #setPosition(position: number, gesture?: string): void {
    const value = this.args.mapping?.toValue(position);
    if (value !== undefined && value !== this.args.value) {
      this.args.onChange?.(value, gesture);
    }
  }

  gesture = new ControlGesture({
    position: () => this.position,
    axis: () => 'x',
    waitForDrag: true,
    travel: (event, from) => (event.clientX - from.clientX) / DRAG_TRAVEL_PX,
    onDragStart: () => {
      this.#drag = `number-drag-${++drags}`;
      this.#dragged = true;
    },
    onPosition: (position) => this.#setPosition(position, this.#drag),
  });

  willDestroy(): void {
    super.willDestroy();
    this.gesture.release();
  }

  down = (event: PointerEvent): void => {
    this.#dragged = false;
    if (this.draggable) this.gesture.down(event);
  };

  /** The arrow keys (and Page Up, Page Down, Home, End) step the value, as on a slider. */
  onButtonKey = (event: KeyboardEvent): void => {
    const mapping = this.args.mapping;
    if (!this.draggable || !mapping) return;
    const next = positionForKey(event, this.position, mapping);
    if (next === null) return;
    event.preventDefault();
    this.#setPosition(next);
  };

  edit = (): void => {
    if (this.#dragged) {
      this.#dragged = false;
      return;
    }
    if (this.args.disabled) return;
    this.#start = this.args.text;
    this.editing = true;
    this.invalid = false;
  };

  /** What is typed is made to fit as it is typed, where the owner says how. */
  onInput = (event: Event): void => {
    const sanitize = this.args.sanitize;
    if (!sanitize) return;
    const input = event.target as HTMLInputElement;
    const fitted = sanitize(input.value);
    if (fitted !== input.value) input.value = fitted;
  };

  get inputmode(): string {
    return this.args.inputmode ?? 'decimal';
  }

  commit = (event: Event): void => {
    if (!this.editing) return;
    const input = event.target as HTMLInputElement;
    if (input.value.trim() === '' || this.args.onCommit(input.value)) {
      this.#close();
    } else {
      this.invalid = true;
    }
  };

  onKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      // Closing the field hands focus back to a button (the number, or a step) while the key is still
      // going down: without this the same Enter would then press that button.
      event.preventDefault();
      this.commit(event);
    } else if (event.key === 'Escape') {
      event.stopPropagation(); // not the sidebar's Escape
      this.#close();
    }
  };

  leave = (event: Event): void => {
    // (the field also loses focus as it is removed, after Enter or Escape: nothing more to do then)
    if (!this.editing) return;
    this.commit(event);
    if (this.editing) this.#close(); // (what was typed could not be read: left as it was)
  };

  <template>
    {{! The box is the readout's, always: while a value is typed the readout stays in it, unseen, holding
        its size, and the field is laid exactly over it. Nothing around it moves when it takes focus. }}
    <span class="number-entry-box" ...attributes>
      {{#if this.editing}}
        <span
          class="number-entry number-entry--held"
          aria-hidden="true"
        >{{@text}}</span>
        <input
          type="text"
          class="number-entry number-entry--editing"
          inputmode={{this.inputmode}}
          maxlength={{@maxlength}}
          autocomplete="off"
          aria-label="{{@label}} value"
          aria-invalid={{if this.invalid "true"}}
          value=""
          data-test-number-input
          {{focusAndSelect this.seeded this.start}}
          {{on "input" this.onInput}}
          {{on "keydown" this.onKeydown}}
          {{on "blur" this.leave}}
        />
      {{else}}
        {{! template-lint-disable no-pointer-down-event-binding }}
        {{! (a drag has to begin when the pointer goes down) }}
        <button
          type="button"
          class="number-entry {{if this.draggable 'number-entry--drag'}}"
          disabled={{@disabled}}
          aria-label="{{@label}}: {{@text}}. Type a value{{if
            this.draggable
            ', or drag, or use the arrow keys'
          }}"
          title={{if this.draggable "Drag to change, click to type"}}
          data-test-number-entry
          {{on "click" this.edit}}
          {{on "pointerdown" this.down}}
          {{on "keydown" this.onButtonKey}}
        >{{@text}}</button>
      {{/if}}
    </span>
  </template>
}
