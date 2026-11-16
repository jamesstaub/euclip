import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { modifier } from 'ember-modifier';
import NumberEntry from 'client-v2/components/ui/number-entry';
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

/** A step holds a whole number from 0 to this: three digits. */
export const STEP_MAX = 999;
/** Two clicks on one step this close together are a double click's, and one thing to undo. */
const DOUBLE_MS = 500;
const LONG_PRESS_MS = 500;
const SLOP_PX = 8;

/** A step's value as it is typed: `0`, `1`, `12`. */
function plain(value: number): string {
  return String(Math.min(STEP_MAX, Math.max(0, Math.round(value))));
}

/** What may be typed in the box: digits, three of them at most. Anything else is dropped as it is typed. */
function digits(text: string): string {
  return text.replace(/\D/g, '').slice(0, 3);
}

/**
 * The `step grid` widget: a declared step grid as a grid of step buttons, as many as the sequence has.
 * Pressing a step switches it off, or back on to what it held. How the grid wraps is in
 * styles/step-grid.css.
 *
 * A step holds a number, not only on or off (a sequence's callback is handed it as `ev.value`: a
 * slice, a level, a note). To set it, a box opens on the step: by a double click, by a long press (the
 * way that can be relied on with a finger; a double tap works too where the browser reports one), or
 * with Enter or a digit on a focused step. Enter or leaving the box commits, Escape gives up. 0 is
 * off; anything above is on, with that value shown on the step. A value is a whole number from 0 to
 * 999: the box takes digits only, three of them.
 *
 * A single click still toggles at once: nothing waits to see whether a second is coming. A double click
 * is therefore two toggles and then the box; the two toggles and what the box commits are one gesture
 * (one step to undo), and if nothing ends up changed there is no step to undo at all.
 */
export default class StepGridWidget extends Component<StepGridWidgetSignature> {
  @service declare audio: AudioService;

  /** The step whose value is being typed, and what the box starts with when a digit opened it. */
  @tracked editing: number | null = null;
  @tracked initial: string | undefined;

  #groups = 0;
  #last: { index: number; at: number; group: string } | null = null;
  #editGroup: string | undefined;
  #before: { stored: boolean; steps: number[] } | null = null;
  #press: ReturnType<typeof setTimeout> | undefined;
  #pressAt: { x: number; y: number } | null = null;
  /** a long press has opened the box: the click that ends the press is not a toggle */
  #swallow = false;

  willDestroy(): void {
    super.willDestroy();
    clearTimeout(this.#press);
  }

  get editingValue(): string {
    return this.editing === null
      ? ''
      : plain(this.args.control.steps[this.editing] ?? 0);
  }

  get editingLabel(): string {
    return `Step ${(this.editing ?? 0) + 1}`;
  }

  /** The gesture a click on a step belongs to: the same one as a click on it a moment ago. */
  #groupFor(index: number): string {
    const now = performance.now();
    const last = this.#last;
    const group =
      last && last.index === index && now - last.at < DOUBLE_MS
        ? last.group
        : `step-${++this.#groups}`;
    if (group !== last?.group) {
      // how the grid stood when the gesture began, to tell at its end whether anything came of it
      this.#before = {
        stored: this.args.control.stored,
        steps: [...this.args.control.steps],
      };
    }
    this.#last = { index, at: now, group };
    return group;
  }

  toggle = (index: number): void => {
    if (this.#swallow) {
      this.#swallow = false;
      return;
    }
    this.audio.toggleStep(
      this.args.scopeId,
      this.args.control.name,
      index,
      this.#groupFor(index),
    );
  };

  /**
   * A double click: its two clicks have toggled the step twice, back to where it was. The box opens on
   * a step that is on (with what it held, or 1), all as one gesture.
   */
  doubleClick = (index: number): void => {
    const group = this.#groupFor(index);
    if ((this.args.control.steps[index] ?? 0) === 0) {
      this.audio.toggleStep(
        this.args.scopeId,
        this.args.control.name,
        index,
        group,
      );
    }
    this.#open(index, undefined, group);
  };

  #open(index: number, initial?: string, group?: string): void {
    clearTimeout(this.#press);
    this.#editGroup = group ?? `step-${++this.#groups}`;
    this.initial = initial;
    this.editing = index;
  }

  /** A finger (or pen) held on a step opens the box; moving off, or lifting sooner, does not. */
  pressDown = (index: number, event: PointerEvent): void => {
    if (event.pointerType === 'mouse') return;
    clearTimeout(this.#press);
    this.#pressAt = { x: event.clientX, y: event.clientY };
    this.#press = setTimeout(() => {
      this.#swallow = true;
      this.#open(index);
    }, LONG_PRESS_MS);
  };

  pressMove = (event: PointerEvent): void => {
    const at = this.#pressAt;
    if (
      at &&
      Math.hypot(event.clientX - at.x, event.clientY - at.y) > SLOP_PX
    ) {
      this.pressEnd();
    }
  };

  pressEnd = (): void => {
    clearTimeout(this.#press);
    this.#pressAt = null;
  };

  /**
   * While the box is open (a long press has just opened it and the finger is still to lift), a press on
   * a step must not take focus from the box: leaving the box is what commits and closes it.
   */
  keepBox = (event: MouseEvent): void => {
    if (this.#swallow) event.preventDefault();
  };

  /** (a long press is also the browser's cue for its own menu, on some phones) */
  noMenu = (event: Event): void => {
    if (this.#swallow || this.editing !== null) event.preventDefault();
  };

  onKeydown = (index: number, event: KeyboardEvent): void => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === 'Enter') {
      event.preventDefault(); // (not also a click: Space is the key that toggles)
      this.#open(index);
    } else if (/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      this.#open(index, event.key);
    }
  };

  /** What was typed: a whole number from 0 to 999. Anything else is refused and the box stays. */
  commit = (typed: string): boolean => {
    const index = this.editing;
    const text = typed.trim();
    if (index === null || !/^\d+$/.test(text)) return false;
    this.audio.setStep(
      this.args.scopeId,
      this.args.control.name,
      index,
      Math.min(STEP_MAX, Number(text)),
      this.#editGroup,
    );
    return true;
  };

  /** The box has closed: focus goes back to its step. */
  done = (): void => {
    const index = this.editing;
    this.editing = null;
    this.initial = undefined;
    this.#swallow = false;
    // A double click whose box changed nothing: its two toggles have left a stored copy of the very
    // pattern the script gives. Forget it again, as part of the same gesture: then nothing has
    // happened, and there is nothing to undo.
    const before = this.#before;
    const steps = this.args.control.steps;
    if (
      before &&
      !before.stored &&
      this.args.control.stored &&
      this.#last?.group === this.#editGroup &&
      before.steps.length === steps.length &&
      before.steps.every((value, at) => value === steps[at])
    ) {
      this.audio.resetControl(
        this.args.scopeId,
        this.args.control.key,
        this.#editGroup,
      );
    }
    this.#before = null;
    if (index !== null) this.#refocus?.(index);
  };

  #refocus: ((index: number) => void) | undefined;

  /**
   * Puts the box on its step: its centre on the step's centre, whatever the step's size and wherever
   * the grid has been scrolled to. Only where that would put part of it off the screen is it moved, and
   * then only as far as it must be.
   */
  place = modifier((box: HTMLElement, [index]: [number | null]) => {
    const grid = box.parentElement;
    if (index === null || !grid) return;
    const step = grid.querySelector<HTMLElement>(`[data-test-step="${index}"]`);
    if (!step) return;
    this.#refocus = (at) =>
      grid.querySelector<HTMLElement>(`[data-test-step="${at}"]`)?.focus();
    // Worked out from where things are drawn, and corrected by where the box then is: so it does not
    // matter what the grid's padding is, or what the box is positioned against.
    box.style.left = '0px';
    box.style.top = '0px';
    const on = step.getBoundingClientRect();
    const zero = box.getBoundingClientRect();
    const margin = 4;
    const clamp = (value: number, low: number, high: number): number =>
      Math.min(Math.max(value, low), Math.max(low, high));
    const wantLeft = clamp(
      on.left + on.width / 2 - zero.width / 2,
      margin,
      window.innerWidth - margin - zero.width,
    );
    const wantTop = clamp(
      on.top + on.height / 2 - zero.height / 2,
      margin,
      window.innerHeight - margin - zero.height,
    );
    box.style.left = `${wantLeft - zero.left}px`;
    box.style.top = `${wantTop - zero.top}px`;
  });

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
      {{#each @control.steps key="@index" as |value index|}}
        {{! template-lint-disable no-pointer-down-event-binding }}
        {{! a long press begins when the finger goes down }}
        <button
          type="button"
          class="step
            {{if (is index @control.playhead) 'step--current'}}
            {{if (shown value) 'step--valued'}}"
          aria-pressed={{pressed value}}
          aria-label={{stepLabel index value}}
          title="Double-click (or hold) to set its value"
          data-test-step={{index}}
          {{on "click" (fn this.toggle index)}}
          {{on "dblclick" (fn this.doubleClick index)}}
          {{on "pointerdown" (fn this.pressDown index)}}
          {{on "pointermove" this.pressMove}}
          {{on "pointerup" this.pressEnd}}
          {{on "pointerleave" this.pressEnd}}
          {{on "pointercancel" this.pressEnd}}
          {{on "mousedown" this.keepBox}}
          {{on "contextmenu" this.noMenu}}
          {{on "keydown" (fn this.onKeydown index)}}
        >{{shown value}}</button>
      {{/each}}
      {{#if (editingAt this.editing)}}
        <NumberEntry
          class="step-entry"
          @text={{this.editingValue}}
          @label={{this.editingLabel}}
          @open={{true}}
          @initial={{this.initial}}
          @inputmode="numeric"
          @maxlength={{3}}
          @sanitize={{digits}}
          @onCommit={{this.commit}}
          @onDone={{this.done}}
          data-test-step-entry={{this.editing}}
          {{this.place this.editing}}
        />
      {{/if}}
    </div>
  </template>
}

function editingAt(index: number | null): boolean {
  return index !== null;
}
