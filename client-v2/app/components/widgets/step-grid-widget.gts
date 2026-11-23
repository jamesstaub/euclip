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
  BEAT_OFF,
  beatsOfNumber,
  beatsDigits,
  numberOfBeats,
  type Beats,
  binaryMax,
  BINARY_MIN,
  COMBINES,
  defaultGenerator,
  GENERATORS,
  readGenerator,
  type Combine,
  type GeneratorKind,
  type GeneratorState,
  type Tool,
} from 'client-v2/controls/generators';
import { mapping, type Mapping } from 'client-v2/controls/modes';
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

/** The column a step (or a lane's bar) stands in: sixteen to a row, whatever else the grid holds. */
function colOf(index: number): number {
  return (index % 16) + 1;
}

/**
 * How many steps make a beat (a quarter note) at this step length: 4 for 1/16, 6 for 1/16t, 2 for 1/8.
 * Where a beat is not a whole number of steps (1/16d), or one step is a beat or more: 4.
 */
function beatOf(step: string | null): number {
  const match = /^1\/(\d+)([td]?)$/.exec(step ?? '1/16');
  if (!match) return 4;
  const per =
    (Number(match[1]) / 4) *
    (match[2] === 't' ? 1.5 : match[2] === 'd' ? 2 / 3 : 1);
  return Number.isInteger(per) && per >= 2 ? per : 4;
}

/** Every other beat's steps are shaded a little, so the steps can be counted at a glance. */
function isAltBeat(index: number, step: string | null): boolean {
  return Math.floor(index / beatOf(step)) % 2 === 1;
}

function isToggle(lane: LaneView): boolean {
  return lane.kind === 'toggle';
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
     * The lanes of these per-step controls (their keys) under it, in the same step columns: a bar for
     * every step, drawn and dragged like a slider. A lane is drawn with its control (a processor's row,
     * the source's overlay), never in the steps tab.
     */
    laneKeys?: readonly string[];
    /** Only its lanes: the steps are not drawn (a lane drawn with its control). */
    hideSteps?: boolean;
    /** what a lane's Hide lane does, in place of hiding it for the track (the source's one lane closes) */
    onHideLane?: (key: string) => void;
  };
  Blocks: {
    /** With generators: the start and the end of the card's header, between which the generator's own cells go */
    lead: [];
    trail: [];
  };
}

/**
 * The `step grid` widget: a declared step grid as a grid of step buttons, as many as the sequence has.
 * A step is on or off: pressing it switches it (one step to undo). What a step plays, beyond whether it
 * plays, is set in the lanes of the controls it drives (a synth's pitch, a sampler's slice), never in the
 * step. How the grid wraps is in styles/step-grid.css.
 */
export default class StepGridWidget extends Component<StepGridWidgetSignature> {
  @service declare audio: AudioService;
  @service declare view: ViewService;

  willDestroy(): void {
    super.willDestroy();
    this.laneGesture.release();
  }

  cellLabel = (index: number, value: number): string =>
    `Step ${index + 1}, ${value === 0 ? 'off' : 'on'}`;

  toggle = (index: number): void => {
    this.audio.toggleStep(this.args.scopeId, this.args.control.name, index);
  };

  // --- lanes: a per-step control's value on every step, in the grid's own columns ---------------------

  /**
   * The lanes drawn under the grid: the ones named. Their bars are items of the grid itself, so they
   * stand under their steps.
   */
  get lanes(): LaneView[] {
    const only = this.args.laneKeys;
    if (!only || only.length === 0) return [];
    return this.audio
      .lanes(this.args.scopeId, this.args.control.name)
      .filter((lane) => only.includes(lane.key));
  }

  /** Every step of a lane follows its control again: one step to undo. */
  clearLane = (key: string): void => {
    this.audio.resetLane(this.args.scopeId, key);
  };

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
      return {
        id,
        label,
        value,
        text: String(value),
        map,
        bare: false,
        off: false,
      };
    };
    switch (this.kind) {
      case 'euclid':
        return [
          whole('hits', 'Hits', state.hits, 0, length),
          whole('rotate', 'Rotate', state.rotate, 0, length - 1),
        ];
      case 'binary':
        // (four digits a slider, a beat of sixteenths each: 16 values to slide through, not 65535)
        return state.beats.map((value, beat) => ({
          ...whole(`beat${beat}`, `Beat ${beat + 1}`, value, BEAT_OFF, 15),
          // (the whole number and its digits are shown once, in the band's head)
          bare: true,
          off: value === BEAT_OFF,
        }));
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
        return { ...state, number: value, beats: beatsOfNumber(value) };
      case 'beat0':
      case 'beat1':
      case 'beat2':
      case 'beat3': {
        const beats = [...state.beats] as Beats;
        beats[Number(id.slice(4))] = value;
        return { ...state, beats, number: numberOfBeats(beats) };
      }
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
    const group = gesture ?? `generate-${++generatorGestures}`;
    const steps = this.args.control.steps;
    const made = applyGenerator(state, steps, 1);
    if (made.steps.length !== steps.length) {
      // (Binary: the grid is as long as the number's digits; the same step to undo)
      this.audio.setGridShape(
        this.args.scopeId,
        this.args.control.key,
        { length: made.steps.length },
        group,
      );
    }
    this.audio.setPattern(
      this.args.scopeId,
      this.args.control.key,
      made.steps,
      made.generator,
      group,
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

  get isBinary(): boolean {
    return this.kind === 'binary';
  }

  get binaryText(): string {
    return String(this.generator.number);
  }

  get binaryDigitsText(): string {
    return beatsDigits(this.generator.beats);
  }

  /** Binary's whole number typed: exact. */
  typeNumber = (typed: string): boolean => {
    const value = Number(typed.trim());
    if (typed.trim() === '' || !Number.isFinite(value)) return false;
    this.#write(
      this.#withDial(
        'number',
        Math.min(binaryMax(), Math.max(BINARY_MIN, Math.round(value))),
      ),
    );
    return true;
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
      applyTool(tool, this.args.control.steps, 1),
      undefined,
      `tool-${++generatorGestures}`,
    );
  };

  <template>
    {{#if @generators}}
      {{! the card's header: the sequence itself (its name, length and step length, Reset, the script) }}
      <div class="sequence-card__head" data-test-seq-head>
        {{yield to="lead"}}
        {{yield to="trail"}}
      </div>
    {{/if}}
    {{! template-lint-disable no-pointer-down-event-binding }}
    {{! (a lane's bar is dragged from where the pointer goes down, as a slider is) }}
    <div
      class="step-grid {{if this.lanes.length 'step-grid--lanes'}}"
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
          <button
            type="button"
            class="step
              {{if (isAltBeat index @control.step) 'step--alt'}}
              {{if (is index @control.playhead) 'step--current'}}"
            aria-pressed={{pressed value}}
            aria-label={{this.cellLabel index value}}
            data-test-step={{index}}
            {{cssVars col=(colOf index)}}
            {{on "click" (fn this.toggle index)}}
          ></button>
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
              {{cssVars col=(colOf index)}}
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
              {{cssVars pos=(this.barPosition lane value) col=(colOf index)}}
              {{on "keydown" (fn this.laneKey lane index)}}
            ></span>
          {{/if}}
        {{/each}}
        {{! its tools: to the right of its bars (of their last row), at the grid's end }}
        <span
          class="lane__tools {{if (isToggle lane) 'lane__tools--row'}}"
          data-test-lane-tools={{lane.key}}
        >
          <LaneMenu
            @scopeId={{@scopeId}}
            @lane={{lane}}
            @onHide={{fn this.hideLane lane.key}}
          />
          <button
            type="button"
            class="lane__clear"
            aria-label="Clear all {{lane.label}} steps"
            title="Every step follows the control again"
            hidden={{if lane.active false true}}
            data-test-lane-clear
            {{on "click" (fn this.clearLane lane.key)}}
          >Clear all</button>
        </span>
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
      </div>
      {{! the generator: a band of its own under the grid, its menus then its sliders }}
      <div class="step-gen" data-test-generators={{@control.name}}>
        <div class="step-gen__head">
          <span class="sequence-card__shape sequence-card__gen">
            <span
              class="sequence-card__label"
              aria-hidden="true"
            >Generate</span>
            <select
              class="select"
              aria-label="Generator"
              data-test-gen-kind
              {{on "change" this.setGenerator}}
              {{selectOptions this.generateOptions this.kind}}
            ></select>
          </span>
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
          <Hint @label="About pattern generators" data-test-gen-hint>
            <p>The generator writes a rhythm into this grid as you move its
              sliders: Euclidean (hits spread evenly), Binary (a number’s
              digits), On / off (a group repeated) and Sieve (every N-th step,
              twice over).</p>
            <p>Binary sets the grid’s length too: its four sliders are four
              beats of four digits each (0 to 15), the first beat the highest,
              and each beat that is on is four steps (5 is .x.x). A beat slid
              below 0 is off, so one beat alone is a pattern of four steps. Type
              the whole number in its box: the beats in front of its first digit
              are turned off. The others fill the length the grid has.</p>
            <p>Onto says how it meets what is there:
              <b>Replace</b>
              writes over it,
              <b>Or</b>
              adds to it,
              <b>And</b>
              keeps only where both have a hit,
              <b>Xor</b>
              flips where they differ.</p>
            <p>The grid’s pattern is what plays and what is kept. The generator
              is a tool: change steps by hand afterwards and they stay as you
              set them, until a slider is moved again.</p>
            <p>◀ ▶ turn the pattern one step, Reverse plays it backwards, Invert
              swaps hits and rests.</p>
          </Hint>
          {{#if this.isBinary}}
            {{! the whole number: typed exactly, and its digits (the pattern, and how long it is) }}
            <span class="step-gen__number" data-test-gen-number>
              <span class="step-gen__label">Number</span>
              <NumberEntry
                @text={{this.binaryText}}
                @label="Binary number"
                @inputmode="numeric"
                @maxlength={{5}}
                @onCommit={{this.typeNumber}}
              />
              <code
                class="step-gen__says"
                data-test-gen-says
              >{{this.binaryDigitsText}}</code>
            </span>
          {{/if}}
        </div>
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
              class="step-gen__dial {{if dial.off 'step-gen__dial--off'}}"
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
              {{#unless dial.bare}}
                {{! its value, as a control's row shows one: press it to type an exact number }}
                <NumberEntry
                  @text={{dial.text}}
                  @label={{dial.label}}
                  @inputmode="numeric"
                  @onCommit={{fn this.typeDial dial}}
                />
              {{/unless}}
            </span>
          {{/each}}
        </div>
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
  /** a beat of Binary that is off: no part of the number */
  off: boolean;
  /** no number box beside it (a beat of Binary: the whole number is typed in the band's head) */
  bare: boolean;
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
