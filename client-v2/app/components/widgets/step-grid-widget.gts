import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { modifier } from 'ember-modifier';
import NumberEntry from 'client-v2/components/ui/number-entry';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import Hint from 'client-v2/components/ui/hint';
import type { StepGridView } from 'client-v2/audio/runner';
import {
  applyGenerator,
  applyTool,
  binaryMax,
  COMBINES,
  defaultGenerator,
  GENERATORS,
  hitsOf,
  isEdited,
  readGenerator,
  written,
  type Combine,
  type GeneratorKind,
  type GeneratorState,
  type Tool,
} from 'client-v2/controls/generators';
import { mapping, type Mapping } from 'client-v2/controls/modes';
import selectOptions from 'client-v2/modifiers/select-options';
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
    /**
     * With its pattern generators and tools under it (the sequence pane's grids). A track row's
     * compact grid is steps only.
     */
    generators?: boolean;
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

  // --- pattern generators (controls/generators.ts): the dials write the pattern as they move ------------

  /** the generator panel is showing */
  @tracked generating = false;
  /** the tab showing, when the person has turned to one whose dials have not written yet */
  @tracked tab: GeneratorKind | null = null;

  panelId = `step-gen-${++generatorPanels}`;

  toggleGenerating = (): void => {
    this.generating = !this.generating;
  };

  /** The dials as they stand: the ones stored with the grid, else ones that suit its pattern. */
  get generator(): GeneratorState {
    const steps = this.args.control.steps;
    return (
      readGenerator(this.args.control.generator, steps) ??
      defaultGenerator(steps)
    );
  }

  get kind(): GeneratorKind {
    return this.tab ?? this.generator.kind;
  }

  isKind = (kind: GeneratorKind): boolean => this.kind === kind;

  setKind = (kind: GeneratorKind): void => {
    // (turning to a tab shows its dials; the pattern is written when one of them moves)
    this.tab = kind;
  };

  onTabKey = (event: KeyboardEvent): void => {
    const at = GENERATORS.findIndex((entry) => entry.id === this.kind);
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0;
    if (step === 0) return;
    event.preventDefault();
    const next =
      GENERATORS[(at + step + GENERATORS.length) % GENERATORS.length]!;
    this.tab = next.id;
    (event.currentTarget as HTMLElement)
      .querySelector<HTMLElement>(`[data-test-gen-tab="${next.id}"]`)
      ?.focus();
  };

  get dials(): Dial[] {
    const state = this.generator;
    const length = this.args.control.steps.length;
    const whole = (
      id: string,
      label: string,
      value: number,
      min: number,
      max: number,
    ): Dial => {
      const map = mapping('stepped', { min, max: Math.max(min, max), step: 1 });
      return { id, label, value, text: String(value), map };
    };
    switch (this.kind) {
      case 'euclid':
        return [
          whole('hits', 'Hits', state.hits, 0, length),
          whole('rotate', 'Rotate', state.rotate, 0, length - 1),
        ];
      case 'binary':
        return [whole('number', 'Number', state.number, 0, binaryMax(length))];
      case 'onoff':
        return [
          whole('on', 'On', state.on, 0, length),
          whole('off', 'Off', state.off, 0, length),
        ];
      case 'sieve':
        return [
          whole('every0', 'Every', state.sieve[0][0], 0, length),
          whole(
            'from0',
            'from',
            state.sieve[0][1],
            0,
            Math.max(0, state.sieve[0][0] - 1),
          ),
          whole('every1', 'and every', state.sieve[1][0], 0, length),
          whole(
            'from1',
            'from',
            state.sieve[1][1],
            0,
            Math.max(0, state.sieve[1][0] - 1),
          ),
        ];
    }
  }

  /** What the dials say, in words: "5 of 16, rotate 2". */
  get dialsSay(): string {
    const state = this.generator;
    const length = this.args.control.steps.length;
    switch (this.kind) {
      case 'euclid':
        return `${state.hits} of ${length}, rotate ${state.rotate}`;
      case 'binary':
        return `${state.number} in binary`;
      case 'onoff':
        return `${state.on} on, ${state.off} off, repeated`;
      case 'sieve':
        return (
          state.sieve
            .filter(([every]) => every > 0)
            .map(([every, from]) => `every ${every} from ${from}`)
            .join(' and ') || 'no steps'
        );
    }
  }

  #withDial(id: string, value: number): GeneratorState {
    const state: GeneratorState = { ...this.generator, kind: this.kind };
    const sieve: GeneratorState['sieve'] = [
      [...state.sieve[0]],
      [...state.sieve[1]],
    ];
    switch (id) {
      case 'hits':
        return { ...state, hits: value };
      case 'rotate':
        return { ...state, rotate: value };
      case 'number':
        return { ...state, number: value };
      case 'on':
        return { ...state, on: value };
      case 'off':
        return { ...state, off: value };
      case 'every0':
      case 'every1': {
        const row = id === 'every0' ? 0 : 1;
        sieve[row] = [value, Math.min(sieve[row][1], Math.max(0, value - 1))];
        return { ...state, sieve };
      }
      case 'from0':
      case 'from1': {
        const row = id === 'from0' ? 0 : 1;
        sieve[row] = [sieve[row][0], value];
        return { ...state, sieve };
      }
      default:
        return state;
    }
  }

  /** Writes what the dials now make into the grid: live, and one step to undo for the gesture. */
  #write(state: GeneratorState, gesture?: string): void {
    const made = applyGenerator(state, this.args.control.steps);
    this.audio.setPattern(
      this.args.scopeId,
      this.args.control.key,
      made.steps,
      made.generator,
      gesture ?? `generate-${++generatorGestures}`,
    );
  }

  /** A dial dragged or stepped. */
  turnDial = (id: string, value: number, gesture?: string): void => {
    this.#write(this.#withDial(id, value), gesture);
  };

  /** A dial's value typed. */
  typeDial = (dial: Dial, typed: string): boolean => {
    const value = dial.map.parse(typed);
    if (value === null) return false;
    this.#write(this.#withDial(dial.id, value));
    return true;
  };

  combines = COMBINES;

  setCombine = (event: Event): void => {
    const combine = (event.target as HTMLSelectElement).value as Combine;
    if (combine === this.generator.combine) return;
    this.#write({ ...this.generator, kind: this.kind, combine });
  };

  /** A tool on the pattern as it stands: one step to undo. */
  useTool = (tool: Tool): void => {
    this.audio.setPattern(
      this.args.scopeId,
      this.args.control.key,
      applyTool(tool, this.args.control.steps),
      undefined,
      `tool-${++generatorGestures}`,
    );
  };

  get hits(): number {
    return hitsOf(this.args.control.steps);
  }

  get writtenOut(): string {
    return written(this.args.control.steps);
  }

  /** Steps have been changed by hand since the dials last wrote: said quietly, and nothing is overwritten. */
  get edited(): boolean {
    return isEdited(
      readGenerator(this.args.control.generator, this.args.control.steps),
      this.args.control.steps,
    );
  }

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
    {{#if @generators}}
      <div class="step-gen" data-test-generators={{@control.name}}>
        <div class="step-gen__bar">
          <button
            type="button"
            class="btn btn--s step-gen__open {{if this.generating 'is-open'}}"
            aria-expanded={{if this.generating "true" "false"}}
            aria-controls={{this.panelId}}
            data-test-gen-toggle
            {{on "click" this.toggleGenerating}}
          >Generate</button>
          <span
            class="step-gen__tools"
            role="group"
            aria-label="Turn the {{@control.label}} pattern"
          >
            {{#each TOOLS as |tool|}}
              <button
                type="button"
                class="btn btn--s"
                aria-label={{tool.says}}
                title={{tool.says}}
                data-test-gen-tool={{tool.id}}
                {{on "click" (fn this.useTool tool.id)}}
              >{{tool.label}}</button>
            {{/each}}
          </span>
          <span class="step-gen__summary" role="status" data-test-gen-summary>
            <b>{{this.hits}} of {{@control.steps.length}}</b>
            <code class="truncate">{{this.writtenOut}}</code>
            {{#if this.edited}}
              <i
                title="Steps were changed by hand since the dials last wrote. Nothing is overwritten until a dial is moved."
                data-test-gen-edited
              >edited</i>
            {{/if}}
          </span>
          <Hint @label="About pattern generators" data-test-gen-hint>
            <p><b>Generate</b>
              opens dials that write a rhythm into this grid as you turn them:
              Euclidean (hits spread evenly), Binary (a number’s bits), On / off
              (a group repeated) and Sieve (every N-th step, twice over).</p>
            <p>The grid’s pattern is what plays and what is kept. The dials are
              a tool: change steps by hand afterwards and they stay as you set
              them, marked “edited”, until a dial is moved again.</p>
            <p>A step that is on keeps the value it had (a slice number, say); a
              new hit is 1. The grid’s length is the script’s.</p>
            <p>◀ ▶ turn the pattern one step, Reverse plays it backwards, Invert
              swaps hits and rests.</p>
          </Hint>
        </div>
        {{#if this.generating}}
          <div class="step-gen__panel" id={{this.panelId}} data-test-gen-panel>
            {{! template-lint-disable no-invalid-interactive }}
            <div
              class="waveform__tabs"
              role="tablist"
              aria-label="Which generator"
              {{on "keydown" this.onTabKey}}
            >
              {{#each GENERATORS as |entry|}}
                <button
                  type="button"
                  class="waveform__tab"
                  role="tab"
                  aria-selected={{if (this.isKind entry.id) "true" "false"}}
                  tabindex={{if (this.isKind entry.id) "0" "-1"}}
                  data-test-gen-tab={{entry.id}}
                  {{on "click" (fn this.setKind entry.id)}}
                >{{entry.label}}</button>
              {{/each}}
            </div>
            <div
              class="step-gen__dials"
              role="tabpanel"
              aria-label={{this.kind}}
            >
              {{#each this.dials key="id" as |dial|}}
                <span class="step-gen__dial" data-test-gen-dial={{dial.id}}>
                  <span class="step-gen__label">{{dial.label}}</span>
                  <NumberEntry
                    @text={{dial.text}}
                    @label={{dial.label}}
                    @inputmode="numeric"
                    @value={{dial.value}}
                    @mapping={{dial.map}}
                    @onChange={{fn this.turnDial dial.id}}
                    @onCommit={{fn this.typeDial dial}}
                  />
                </span>
              {{/each}}
              <label class="step-gen__dial step-gen__dial--combine">
                <span class="step-gen__label">Onto what is there</span>
                <select
                  class="select"
                  data-test-gen-combine
                  {{on "change" this.setCombine}}
                  {{selectOptions this.combines this.generator.combine}}
                ></select>
              </label>
              <span
                class="step-gen__says"
                data-test-gen-says
              >{{this.dialsSay}}</span>
            </div>
          </div>
        {{/if}}
      </div>
    {{/if}}
  </template>
}

/** A dial of a generator: a whole number in a range, dragged, stepped or typed. */
interface Dial {
  id: string;
  label: string;
  value: number;
  text: string;
  map: Mapping;
}

const TOOLS: readonly { id: Tool; label: string; says: string }[] = [
  { id: 'left', label: '◀', says: 'Turn the pattern one step earlier' },
  { id: 'right', label: '▶', says: 'Turn the pattern one step later' },
  { id: 'reverse', label: 'Reverse', says: 'Play the pattern backwards' },
  { id: 'invert', label: 'Invert', says: 'Swap hits and rests' },
];

let generatorGestures = 0;
let generatorPanels = 0;

function editingAt(index: number | null): boolean {
  return index !== null;
}
