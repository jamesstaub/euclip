import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { modifier } from 'ember-modifier';
import NumberEntry from 'client-v2/components/ui/number-entry';
import Slider from 'client-v2/components/ui/slider';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import LaneMenu from 'client-v2/components/lane-menu';
import Hint from 'client-v2/components/ui/hint';
import type { LaneView, StepGridView } from 'client-v2/audio/runner';
import { ControlGesture } from 'client-v2/controls/gesture';
import { mappingOf } from 'client-v2/controls/view';
import cssVars from 'client-v2/modifiers/css-vars';
import {
  applyGenerator,
  applyTool,
  hitFill,
  binaryMax,
  COMBINES,
  defaultGenerator,
  GENERATORS,
  readGenerator,
  type Combine,
  type GeneratorKind,
  type GeneratorState,
  type Tool,
} from 'client-v2/controls/generators';
import { mapping, noteName, type Mapping } from 'client-v2/controls/modes';
import selectOptions, {
  type SelectOption,
} from 'client-v2/modifiers/select-options';
import type AudioService from 'client-v2/services/audio';
import type ViewService from 'client-v2/services/view';

function pressed(value: number): 'true' | 'false' {
  return value !== 0 ? 'true' : 'false';
}

function is(a: number, b: number | null | undefined): boolean {
  return a === b;
}

function isToggle(lane: LaneView): boolean {
  return lane.kind === 'toggle';
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

/** What a lane's caption says for a unit that is not the parameter's own. */
const LANE_UNITS: Readonly<Record<string, string>> = {
  'sequence-sync': 'seq',
  semitones: 'st',
  'ratio-cents': 'ct',
  note: 'note',
  cents: 'note + ct',
  decibels: 'dB',
  ms: 'ms',
  percent: '%',
  slice: 'slice',
  stepped: 'steps',
  exponential: 'exp',
  linear: 'lin',
  steps: 'steps',
  hz: 'Hz',
  seconds: 's',
  ratio: 'ratio',
};

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
    /**
     * With the lanes of the sequence's per-step controls under it, in the same step columns: a bar
     * for every step, drawn and dragged like a slider.
     */
    lanes?: boolean;
    /**
     * Only these lanes (controls' keys) are shown. Absent: all of them (the sequence pane).
     */
    laneKeys?: readonly string[];
    /** Only its lanes: the steps are not drawn (a lane drawn with its control). */
    hideSteps?: boolean;
    /** what a lane's Hide lane does, in place of hiding it for the track (the source's one lane closes) */
    onHideLane?: (key: string) => void;
    /**
     * The synth editor's strip of the same steps: a step shows its note name (its value is a MIDI note),
     * and a tap chooses it (`onSelect`, at once: the value box and its keys are this grid's own) instead
     * of toggling it. `selected` is the chosen step.
     */
    notes?: boolean;
    selected?: number | null;
    /** a tap on a step (toggling the choice); `on` true: the double click that opens the box chooses it */
    onSelect?: (index: number, on?: boolean) => void;
  };
  Blocks: {
    /** With generators: the start and the end of the card's header, between which the generator's own cells go */
    lead: [];
    trail: [];
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
  @service declare view: ViewService;

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
    this.laneGesture.release();
  }

  /** What a step shows: what it holds, or in the synth's strip its note's name. */
  cellText = (value: number): string =>
    this.args.notes
      ? value <= 0
        ? ''
        : value <= 127
          ? noteName(value)
          : String(value)
      : shown(value);

  cellLabel = (index: number, value: number): string =>
    this.args.notes
      ? `Step ${index + 1}, ${value <= 0 ? 'rest' : this.cellText(value)}`
      : stepLabel(index, value);

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

  /** the steps of the last two clicks: a double click is two on the same one */
  #clicked: [number | null, number | null] = [null, null];

  toggle = (index: number): void => {
    if (this.#swallow) {
      this.#swallow = false;
      return;
    }
    this.#clicked = [this.#clicked[1], index];
    if (this.args.onSelect) {
      this.args.onSelect(index);
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
    // Two quick taps on neighbouring steps are near enough, where steps are narrow, for a browser to
    // call them a double click on the second. They are two taps: each has toggled its own step.
    if (this.#clicked[0] !== index) return;
    const group = this.#groupFor(index);
    if (this.args.onSelect) {
      // the two taps chose and unchose it: it is chosen, and the box opens on it
      this.args.onSelect(index, true);
      this.#open(index, undefined, group);
      return;
    }
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

  // --- lanes: a per-step control's value on every step, in the grid's own columns ---------------------

  /**
   * The lanes drawn under the grid: the ones named, else the ones the track shows (a lane in play, or
   * one the person has opened). Their bars are items of the grid itself, so they stand under their steps.
   */
  get lanes(): LaneView[] {
    if (!this.args.lanes) return [];
    const all = this.audio.lanes(this.args.scopeId, this.args.control.name);
    const only = this.args.laneKeys;
    return only === undefined
      ? all.filter((lane) =>
          this.view.isLaneShown(this.args.scopeId, lane.key, lane.active),
        )
      : all.filter((lane) => only.includes(lane.key));
  }

  /** Hides a lane, wherever the track draws it. */
  hideLane = (key: string): void => {
    if (this.args.onHideLane) this.args.onHideLane(key);
    else this.view.setLane(this.args.scopeId, key, false);
  };

  isLocked = (lane: LaneView, index: number): boolean =>
    lane.locked[index] ?? false;

  isOn = (value: number): boolean => value > 0;

  /** A toggle's cell pressed: a step that has its own value follows the control again; one that follows gets the other value. */
  #tapCell(lane: LaneView, index: number): void {
    this.audio.setLaneValue(
      this.args.scopeId,
      lane.key,
      index,
      lane.locked[index] ? null : !((lane.values[index] ?? 0) > 0),
    );
  }

  /** The unit a lane's values are in, where it is not the obvious one: ` · note`, ` · seq`. */
  unitOf = (lane: LaneView): string => {
    const control = lane.control;
    return control.modes.length > 1 && control.mode !== control.modes[0]
      ? ` · ${LANE_UNITS[control.mode] ?? control.mode}`
      : '';
  };

  /** the bar the pointer is on or dragging, to say its value in the lane's head */
  @tracked laneAt: { key: string; index: number } | null = null;
  /** the bar whose value is being typed */
  @tracked laneEditing: { key: string; index: number } | null = null;

  #lane: {
    key: string;
    index: number;
    start: number;
    group: string;
    rects: DOMRect[];
  } | null = null;

  #laneOf(key: string): LaneView | undefined {
    return this.lanes.find((lane) => lane.key === key);
  }

  /** Where along a bar's travel a value is: 0 at its foot, 1 at its top. */
  barPosition = (lane: LaneView, value: number): number =>
    mappingOf(lane.control)?.toPosition(value) ?? 0;

  /** What a lane's head says: the value of the bar under the pointer, in the control's unit. */
  laneSays = (lane: LaneView): string => {
    const at = this.laneAt;
    if (!at || at.key !== lane.key) return '';
    const value = lane.values[at.index];
    if (value === undefined) return '';
    const text =
      lane.kind === 'toggle'
        ? value > 0
          ? 'on'
          : 'off'
        : (mappingOf(lane.control)?.format(value) ?? String(value));
    return `step ${at.index + 1}: ${text}${lane.locked[at.index] ? '' : ' (follows the control)'}`;
  };

  /** The bar a pointer is over: the one in its column, in the nearest row (a long sequence wraps). */
  #barAt(event: PointerEvent): number {
    const lane = this.#lane;
    if (!lane) return 0;
    let best = lane.index;
    let distance = Infinity;
    lane.rects.forEach((rect, index) => {
      const dx =
        event.clientX < rect.left
          ? rect.left - event.clientX
          : event.clientX > rect.right
            ? event.clientX - rect.right
            : 0;
      const dy =
        event.clientY < rect.top
          ? rect.top - event.clientY
          : event.clientY > rect.bottom
            ? event.clientY - rect.bottom
            : 0;
      // (its column first: a pointer dragged above or below the lane still paints the bar it is over)
      const far = dx * 1000 + dy;
      if (far < distance) {
        distance = far;
        best = index;
      }
    });
    return best;
  }

  #setBar(position: number): void {
    const held = this.#lane;
    const lane = held && this.#laneOf(held.key);
    const map = lane && mappingOf(lane.control);
    if (!held || !lane || !map) return;
    if (this.laneAt?.key !== held.key || this.laneAt.index !== held.index) {
      this.laneAt = { key: held.key, index: held.index };
    }
    this.audio.setLaneValue(
      this.args.scopeId,
      held.key,
      held.index,
      map.toValue(position),
      held.group,
    );
  }

  /**
   * A lane's bars are dragged as sliders are, with the gestures every control shares: across the
   * steps to paint their values, up and down for one; Shift moves the bar it began on finely; a double
   * click (or tap), or a long press, opens the number box on a bar. The whole gesture is one step to undo.
   */
  laneGesture = new ControlGesture({
    position: () => {
      const held = this.#lane;
      const lane = held && this.#laneOf(held.key);
      return held && lane
        ? this.barPosition(lane, lane.values[held.index] ?? 0)
        : 0;
    },
    positionAt: (event) => {
      const held = this.#lane;
      if (!held) return 0;
      held.index = this.#barAt(event);
      const rect = held.rects[held.index];
      return rect ? 1 - (event.clientY - rect.top) / (rect.height || 1) : 0;
    },
    // (Shift: the bar the gesture began on, a tenth as fast)
    travel: (event, from) => {
      const held = this.#lane;
      const rect = held?.rects[held.start];
      if (held) held.index = held.start;
      return (from.clientY - event.clientY) / (rect?.height || 1);
    },
    onPosition: (position) => this.#setBar(position),
    onReset: () => this.#editBar(),
    onMenu: () => this.#editBar(),
  });

  #editBar(): void {
    const held = this.#lane;
    if (held) this.laneEditing = { key: held.key, index: held.index };
  }

  laneDown = (event: PointerEvent): void => {
    const bar = (event.target as Element).closest<HTMLElement>(
      '[data-lane-step]',
    );
    const key = bar?.dataset['lane'];
    if (!bar || key === undefined) return;
    const grid = event.currentTarget as HTMLElement;
    const index = Number(bar.dataset['laneStep']);
    const tapped = this.#laneOf(key);
    if (tapped?.kind === 'toggle') {
      // (a toggle's cell is pressed, not dragged)
      if (event.button === 0) this.#tapCell(tapped, index);
      return;
    }
    this.#lane = {
      key,
      index,
      start: index,
      group: `lane-${++generatorGestures}`,
      rects: [
        ...grid.querySelectorAll<HTMLElement>(
          `[data-lane-step][data-lane="${CSS.escape(key)}"]`,
        ),
      ].map((element) => element.getBoundingClientRect()),
    };
    this.laneGesture.down(event);
  };

  laneHover = (event: PointerEvent): void => {
    if (this.laneGesture.active) return;
    const bar = (event.target as Element).closest<HTMLElement>(
      '[data-lane-step]',
    );
    const key = bar?.dataset['lane'];
    const index = Number(bar?.dataset['laneStep']);
    if (!bar || key === undefined) {
      if (this.laneAt !== null) this.laneAt = null;
    } else if (this.laneAt?.key !== key || this.laneAt.index !== index) {
      this.laneAt = { key, index };
    }
  };

  laneLeave = (): void => {
    if (!this.laneGesture.active && this.laneAt !== null) this.laneAt = null;
  };

  /**
   * The arrow keys on a focused bar step its value, as a slider's do; Enter opens the number box.
   * A toggle's cell: Enter or Space presses it. Delete or Backspace: the step follows the control again.
   */
  laneKey = (lane: LaneView, index: number, event: KeyboardEvent): void => {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      this.audio.setLaneValue(this.args.scopeId, lane.key, index, null);
      return;
    }
    if (lane.kind === 'toggle') {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.#tapCell(lane, index);
      }
      return;
    }
    const map = mappingOf(lane.control);
    if (!map) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      this.laneEditing = { key: lane.key, index };
      return;
    }
    const step = map.keyStep * (event.shiftKey && !map.discrete ? 0.1 : 1);
    const at = map.toPosition(lane.values[index] ?? 0);
    const next =
      event.key === 'ArrowUp'
        ? at + step
        : event.key === 'ArrowDown'
          ? at - step
          : null;
    if (next === null) return;
    event.preventDefault();
    this.audio.setLaneValue(
      this.args.scopeId,
      lane.key,
      index,
      map.toValue(Math.min(1, Math.max(0, next))),
    );
  };

  get laneEditingText(): string {
    const editing = this.laneEditing;
    const lane = editing && this.#laneOf(editing.key);
    const value = lane?.values[editing!.index];
    return lane && value !== undefined
      ? (mappingOf(lane.control)?.format(value) ?? String(value))
      : '';
  }

  /** A value typed for a bar; nothing typed: the step follows the control again. */
  commitLane = (typed: string): boolean => {
    const editing = this.laneEditing;
    const lane = editing && this.#laneOf(editing.key);
    if (editing && lane && typed.trim() === '') {
      this.audio.setLaneValue(this.args.scopeId, lane.key, editing.index, null);
      return true;
    }
    const value = lane ? mappingOf(lane.control)?.parse(typed) : null;
    if (!editing || value === null || value === undefined) return false;
    this.audio.setLaneValue(
      this.args.scopeId,
      editing.key,
      editing.index,
      value,
    );
    return true;
  };

  laneDone = (): void => {
    this.laneEditing = null;
  };

  /** Puts the number box on its bar: centred on it, moved only as far as keeps it on the screen. */
  placeOnBar = modifier(
    (box: HTMLElement, [editing]: [{ key: string; index: number } | null]) => {
      const grid = box.parentElement;
      if (!editing || !grid) return;
      const bar = grid.querySelector<HTMLElement>(
        `[data-lane-step="${editing.index}"][data-lane="${CSS.escape(editing.key)}"]`,
      );
      if (!bar) return;
      box.style.left = '0px';
      box.style.top = '0px';
      const on = bar.getBoundingClientRect();
      const zero = box.getBoundingClientRect();
      const clamp = (value: number, low: number, high: number): number =>
        Math.min(Math.max(value, low), Math.max(low, high));
      const left = clamp(
        on.left + on.width / 2 - zero.width / 2,
        4,
        window.innerWidth - 4 - zero.width,
      );
      const top = clamp(
        on.top + on.height / 2 - zero.height / 2,
        4,
        window.innerHeight - 4 - zero.height,
      );
      box.style.left = `${left - zero.left}px`;
      box.style.top = `${top - zero.top}px`;
    },
  );

  // --- pattern generators (controls/generators.ts): the dials write the pattern as they move ------------

  /** the tab showing, when the person has turned to one whose dials have not written yet */
  @tracked tab: GeneratorKind | null = null;

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

  setKind = (kind: GeneratorKind): void => {
    // (turning to a tab shows its dials; the pattern is written when one of them moves)
    this.tab = kind;
  };

  generateOptions: readonly SelectOption[] = GENERATORS.map((entry) => ({
    value: entry.id,
    label: entry.label,
  }));

  /** The Generate select: its dials show; the pattern is written when one of them moves. */
  setGenerator = (event: Event): void => {
    this.setKind((event.target as HTMLSelectElement).value as GeneratorKind);
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
        return [whole('number', 'Number', state.number, 0, binaryMax())];
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

  /** What a new hit is on an empty grid: a note on a track that plays its steps as notes, else 1. */
  get #fill(): number {
    return hitFill(
      this.args.notes === true,
      this.audio.sources(this.args.scopeId),
    );
  }

  /** Writes what the dials now make into the grid: live, and one step to undo for the gesture. */
  #write(state: GeneratorState, gesture?: string): void {
    const made = applyGenerator(state, this.args.control.steps, this.#fill);
    this.audio.setPattern(
      this.args.scopeId,
      this.args.control.key,
      made.steps,
      made.generator,
      gesture ?? `generate-${++generatorGestures}`,
    );
  }

  /**
   * A dial's slider moved: the pattern is rewritten at once. Every move of one drag (or one run of
   * key presses on it) is the same gesture: one step to undo.
   */
  #dialGesture = '';

  newDialGesture = (): void => {
    this.#dialGesture = `dial-${++generatorGestures}`;
  };

  turnDial = (id: string, value: number): void => {
    if (this.#dialGesture === '') this.newDialGesture();
    this.#write(this.#withDial(id, Math.round(value)), this.#dialGesture);
  };

  /** A dial's value typed. */
  typeDial = (dial: Dial, typed: string): boolean => {
    const value = dial.map.parse(typed);
    if (value === null) return false;
    this.#write(this.#withDial(dial.id, value));
    return true;
  };

  /** (short in the control: what each does is said behind the "?") */
  combines: readonly SelectOption[] = COMBINES.map((combine) => ({
    value: combine.value,
    label: COMBINE_SHORT[combine.value],
  }));

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
      applyTool(tool, this.args.control.steps, this.#fill),
      undefined,
      `tool-${++generatorGestures}`,
    );
  };

  <template>
    {{#if @generators}}
      {{! the card's header: the pane's cells, with the generator's two between them }}
      <div class="sequence-card__head" data-test-seq-head>
        {{yield to="lead"}}
        <span class="sequence-card__shape sequence-card__gen">
          <span class="sequence-card__label" aria-hidden="true">Generate</span>
          <select
            class="select"
            aria-label="Generator"
            data-test-gen-kind
            {{on "change" this.setGenerator}}
            {{selectOptions this.generateOptions this.kind}}
          ></select>
        </span>
        {{! template-lint-disable no-invalid-interactive }}
        <span class="sequence-card__shape sequence-card__onto">
          <span class="sequence-card__label" aria-hidden="true">Onto</span>
          <select
            class="select"
            aria-label="Combine with existing pattern"
            data-test-gen-combine
            {{on "change" this.setCombine}}
            {{selectOptions this.combines this.generator.combine}}
          ></select>
        </span>
        {{yield to="trail"}}
      </div>
      <div class="step-gen" data-test-generators={{@control.name}}>
        <div
          class="step-gen__dials"
          role="group"
          aria-label="{{this.kind}} generator"
          data-test-gen-panel
        >
          {{#each this.dials key="id" as |dial|}}
            {{! template-lint-disable no-pointer-down-event-binding no-invalid-interactive }}
            {{! (a press or a key on a dial begins a gesture: all it then writes is one step to undo) }}
            <span
              class="step-gen__dial"
              data-test-gen-dial={{dial.id}}
              {{on "pointerdown" this.newDialGesture capture=true}}
              {{on "keydown" this.newDialGesture capture=true}}
            >
              <span class="step-gen__label">{{dial.label}}</span>
              <Slider
                @value={{dial.value}}
                @mapping={{dial.map}}
                @label={{dial.label}}
                @onChange={{fn this.turnDial dial.id}}
              />
              {{! its value, as a control's row shows one: press it to type an exact number }}
              <NumberEntry
                @text={{dial.text}}
                @label={{dial.label}}
                @inputmode="numeric"
                @onCommit={{fn this.typeDial dial}}
              />
            </span>
          {{/each}}
        </div>
      </div>
    {{/if}}
    {{! template-lint-disable no-pointer-down-event-binding }}
    {{! (a lane's bar is dragged from where the pointer goes down, as a slider is) }}
    <div
      class="step-grid"
      role="group"
      aria-label="{{@control.label}} steps"
      data-sequence={{@control.name}}
      data-stored={{if @control.stored "true"}}
      data-test-step-grid={{@control.name}}
      ...attributes
      {{on "pointerdown" this.laneDown}}
      {{on "pointermove" this.laneHover}}
      {{on "pointerleave" this.laneLeave}}
    >
      {{#unless @hideSteps}}
        {{#each @control.steps key="@index" as |value index|}}
          {{! template-lint-disable no-pointer-down-event-binding }}
          {{! a long press begins when the finger goes down }}
          <button
            type="button"
            class="step
              {{if (is index @control.playhead) 'step--current'}}
              {{if (shown value) 'step--valued'}}"
            aria-pressed={{pressed value}}
            aria-label={{this.cellLabel index value}}
            data-selected={{if (is index @selected) "true"}}
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
          >{{this.cellText value}}</button>
        {{/each}}
      {{/unless}}
      {{#each this.lanes key="key" as |lane|}}
        {{! a lane: its head across the grid, then a bar under every step (items of the same grid) }}
        <div class="lane__head" data-test-lane={{lane.key}}>
          <b class="truncate" data-test-lane-caption>{{lane.label}}{{this.unitOf
              lane
            }}</b>
          <span class="lane__says" data-test-lane-says>{{this.laneSays
              lane
            }}</span>
          <LaneMenu
            @scopeId={{@scopeId}}
            @lane={{lane}}
            @onHide={{fn this.hideLane lane.key}}
          />
        </div>
        {{#each lane.values key="@index" as |value index|}}
          {{#if (isToggle lane)}}
            {{! template-lint-disable no-invalid-interactive }}
            <span
              class="lane__bar lane__bar--toggle
                {{if (this.isLocked lane index) 'lane__bar--locked'}}
                {{if (is index @control.playhead) 'lane__bar--current'}}"
              role="switch"
              tabindex="0"
              aria-label="{{lane.label}}, step {{plusOne index}}"
              aria-checked={{if (this.isOn value) "true" "false"}}
              data-on={{if (this.isOn value) "true"}}
              data-locked={{if (this.isLocked lane index) "true"}}
              data-lane={{lane.key}}
              data-lane-step={{index}}
              {{on "keydown" (fn this.laneKey lane index)}}
            ></span>
          {{else}}
            {{! template-lint-disable no-invalid-interactive }}
            <span
              class="lane__bar
                {{if (this.isLocked lane index) 'lane__bar--locked'}}
                {{if (is index @control.playhead) 'lane__bar--current'}}"
              role="slider"
              tabindex="0"
              aria-label="{{lane.label}}, step {{plusOne index}}"
              aria-orientation="vertical"
              aria-valuenow={{value}}
              data-locked={{if (this.isLocked lane index) "true"}}
              data-lane={{lane.key}}
              data-lane-step={{index}}
              {{cssVars pos=(this.barPosition lane value)}}
              {{on "keydown" (fn this.laneKey lane index)}}
            ></span>
          {{/if}}
        {{/each}}
      {{/each}}
      {{#if this.laneEditing}}
        <NumberEntry
          class="step-entry lane-entry"
          @text={{this.laneEditingText}}
          @label="Step value"
          @open={{true}}
          @onCommit={{this.commitLane}}
          @onDone={{this.laneDone}}
          data-test-lane-entry
          {{this.placeOnBar this.laneEditing}}
        />
      {{/if}}
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
      <div class="step-tools" data-test-gen-tools>
        <span
          class="step-tools__buttons"
          role="group"
          aria-label="Turn the {{@control.label}} pattern"
        >
          {{#each TOOLS as |tool|}}
            <button
              type="button"
              class="btn btn--s btn--quiet"
              aria-label={{tool.says}}
              title={{tool.says}}
              data-test-gen-tool={{tool.id}}
              {{on "click" (fn this.useTool tool.id)}}
            >{{tool.label}}</button>
          {{/each}}
        </span>
        <Hint @label="About pattern generators" data-test-gen-hint>
          <p>The generator writes a rhythm into this grid as you move its
            sliders: Euclidean (hits spread evenly), Binary (a number’s bits),
            On / off (a group repeated) and Sieve (every N-th step, twice over).</p>
          <p>Onto says how it meets what is there:
            <b>Replace</b>
            writes over it,
            <b>Or</b>
            adds to it,
            <b>And</b>
            keeps only where both have a hit,
            <b>Xor</b>
            flips where they differ.</p>
          <p>The grid’s pattern is what plays and what is kept. The generator is
            a tool: change steps by hand afterwards and they stay as you set
            them, until a slider is moved again.</p>
          <p>A step that is on keeps the value it had (a slice number, say); a
            new hit is 1. The grid’s length is the script’s.</p>
          <p>◀ ▶ turn the pattern one step, Reverse plays it backwards, Invert
            swaps hits and rests.</p>
        </Hint>
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

const COMBINE_SHORT: Record<Combine, string> = {
  replace: 'Replace',
  or: 'Or',
  and: 'And',
  xor: 'Xor',
};

function plusOne(index: number): number {
  return index + 1;
}

function editingAt(index: number | null): boolean {
  return index !== null;
}
