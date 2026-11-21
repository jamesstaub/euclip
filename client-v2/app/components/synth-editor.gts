import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { isDestroyed, isDestroying } from '@ember/destroyable';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import { modifier } from 'ember-modifier';
import Icon from 'client-v2/components/icon';
import SourceControls from 'client-v2/components/source-controls';
import StepGridWidget from 'client-v2/components/widgets/step-grid-widget';
import Hint from 'client-v2/components/ui/hint';
import type { StepGridView, SynthView } from 'client-v2/audio/runner';
import { hzToNote, noteName, noteToHz } from 'client-v2/controls/modes';
import selectOptions from 'client-v2/modifiers/select-options';
import type AudioService from 'client-v2/services/audio';
import type SourceScopeService from 'client-v2/services/source-scope';
import type ViewService from 'client-v2/services/view';

export interface SynthEditorSignature {
  Element: HTMLElement;
  Args: {
    scopeId: string;
    synth: SynthView;
    /** every source editor of the script, when there are several to choose between */
    others?: readonly { key: string; label: string }[];
    onChoose?: (key: string) => void;
  };
}

/** Lowest and highest MIDI notes the keyboard can show (C0 to B8). */
const LOWEST = 12;
const HIGHEST = 119;
/** The white keys of an octave, as semitones above its C; the black keys sit after the white key before them. */
const WHITE = [0, 2, 4, 5, 7, 9, 11] as const;
const BLACK: readonly { at: number; semitone: number }[] = [
  { at: 1, semitone: 1 },
  { at: 2, semitone: 3 },
  { at: 4, semitone: 6 },
  { at: 5, semitone: 8 },
  { at: 6, semitone: 10 },
];
/** Narrower than this (rem) the keyboard shows one octave, not two. */
const TWO_OCTAVES_AT = 34;

/** Bars for the noise picture, made once: a fixed pseudo-random run, so it never changes. */
const NOISE_BARS: readonly { x: number; y: number; h: number }[] = (() => {
  let seed = 7;
  const bars: { x: number; y: number; h: number }[] = [];
  for (let i = 0; i < 48; i++) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const h = 3 + (seed % 19);
    bars.push({ x: i * 2, y: (24 - h) / 2, h });
  }
  return bars;
})();

interface Key {
  midi: number;
  name: string;
  /** a C: its key says its octave */
  label: string | null;
}

interface Octave {
  base: number;
  white: Key[];
  black: (Key & { at: number })[];
}

function key(midi: number): Key {
  return {
    midi,
    name: noteName(midi),
    label: midi % 12 === 0 ? noteName(midi) : null,
  };
}

/** Draws the source's output on the canvas while the editor is on screen (services/source-scope.ts). */
const showScope = modifier<{
  Element: HTMLCanvasElement;
  Args: {
    Positional: [service: SourceScopeService, scopeId: string, nodeId: string];
  };
}>((canvas, [service, scopeId, nodeId]) =>
  service.register(canvas, scopeId, nodeId),
);

/** Tells the editor how wide its keyboard is, so it shows one octave or two. Once per size change. */
const measure = modifier<{
  Element: HTMLElement;
  Args: { Positional: [report: (octaves: number) => void] };
}>((element, [report]) => {
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const look = (): void =>
    report(element.clientWidth / (rem || 16) >= TWO_OCTAVES_AT ? 2 : 1);
  look();
  if (typeof ResizeObserver === 'undefined') return;
  const observer = new ResizeObserver(look);
  observer.observe(element);
  return () => observer.disconnect();
});

/**
 * The synth source editor: an oscilloscope of what the source makes, a keyboard that is another view of
 * its pitch control, and the controls the script declares for it (the standard rows).
 *
 * The keyboard sets the pitch control's single value in Hz, as the same control in note mode would, and
 * plays the note: an oscillator has its pitch set and is triggered (a closed gate opens, an envelope after
 * it opens), a synth macro is triggered with the note as its pitch; the note is released when the finger
 * or key goes up. A drag across keys glides through notes, all of it one undo step; so is each press.
 * With a value for every step on the pitch control the keyboard still sets the single value and says
 * so: the lane is not rewritten.
 */
export default class SynthEditor extends Component<SynthEditorSignature> {
  @service declare audio: AudioService;
  @service declare view: ViewService;
  @service('source-scope') declare scope: SourceScopeService;

  /**
   * The lowest C showing. Set once, when the editor first shows, so the pitch (or the first note of the
   * steps) is in view; after that only the octave buttons (and PageUp / PageDown on the keyboard)
   * change it. Setting a pitch never moves the view.
   */
  @tracked private shifted = 0;
  /** the step chosen to be given notes: view state, not the project's */
  @tracked private chosen: number | null = null;
  @tracked octaves = 2;
  /** the key a finger or key is holding down */
  @tracked down: number | null = null;
  /** a synth macro keeps no pitch: the note it was last played at */
  @tracked private lastPlayed: number | null = null;

  /** the step a press on a key is giving its note to (fixed when the press began) */
  #target: number | null = null;
  #held = false;
  #group = 0;
  #gesture: string | undefined;
  #pointer: number | null = null;

  constructor(owner: unknown, args: SynthEditorSignature['Args']) {
    super(owner as never, args);
    const first = this.grid?.steps.find((value) => value > 0);
    const around = this.pitchNote ?? first ?? 60;
    this.shifted = clampBase(Math.floor(around / 12) * 12, this.octaves);
  }

  setOctaves = (octaves: number): void => {
    // (told while the keyboard is being drawn: the change waits until it has been)
    queueMicrotask(() => {
      if (isDestroying(this) || isDestroyed(this)) return;
      if (octaves !== this.octaves) this.octaves = octaves;
    });
  };

  // --- what the pitch is now -----------------------------------------------------------------------------------

  get hz(): number | null {
    const value = this.args.synth.pitch?.value;
    return typeof value === 'number' && value > 0 ? value : null;
  }

  /** The pitch as a note number, with the fraction: null when there is none. */
  get pitchNote(): number | null {
    if (this.args.synth.playsNote) return this.lastPlayed;
    const hz = this.hz;
    return hz === null ? null : hzToNote(hz);
  }

  /** What the keyboard marks: the chosen step's note, else the pitch. */
  get exact(): number | null {
    const at = this.selected;
    if (at !== null) {
      const value = this.grid?.steps[at] ?? 0;
      return value > 0 ? value : null;
    }
    return this.pitchNote;
  }

  get nearest(): number | null {
    const exact = this.exact;
    return exact === null ? null : Math.round(exact);
  }

  get cents(): number {
    const exact = this.exact;
    return exact === null ? 0 : Math.round((exact - Math.round(exact)) * 100);
  }

  /** `A4`, `A4 +13 ct`; for a pitch out of the audible range of notes, its Hz only. */
  get readout(): string {
    const nearest = this.nearest;
    const at = this.selected;
    if (at !== null) {
      return `Step ${at + 1}: ${nearest === null ? 'rest' : noteName(nearest)}`;
    }
    if (nearest === null) return this.args.synth.playsNote ? 'No note yet' : '';
    const cents = this.cents;
    const text = `${noteName(nearest)}${cents === 0 ? '' : ` ${cents > 0 ? '+' : '−'}${Math.abs(cents)} ct`}`;
    const hz = this.hz;
    return hz === null || this.args.synth.playsNote || at !== null
      ? text
      : `${text} · ${hz < 100 ? hz.toFixed(2) : hz.toFixed(1)} Hz`;
  }

  get hasKeyboard(): boolean {
    if (this.args.synth.noise) return false;
    return this.args.synth.pitch !== null || this.args.synth.playsNote;
  }

  /** Steps of the pitch's lane hold values of their own: the keyboard sets the others, and says so. */
  get perStep(): boolean {
    const lane = this.args.synth.pitch?.lane;
    return lane !== undefined && !lane.missing && lane.locked > 0;
  }

  get perStepText(): string | null {
    const lane = this.args.synth.pitch?.lane;
    if (!lane || lane.missing || lane.locked === 0) return null;
    return `${lane.locked} of ${lane.steps} steps of ${lane.sequence} hold a pitch of their own: the keys set the others.`;
  }

  // --- the keys ------------------------------------------------------------------------------------------------

  get base(): number {
    return clampBase(this.shifted, this.octaves);
  }

  get span(): number {
    return this.octaves * 12;
  }

  get range(): string {
    return `${noteName(this.base)} to ${noteName(this.base + this.span - 1)}`;
  }

  get octavesShown(): Octave[] {
    const list: Octave[] = [];
    for (let at = 0; at < this.octaves; at++) {
      const base = this.base + at * 12;
      list.push({
        base,
        white: WHITE.map((semitone) => key(base + semitone)),
        black: BLACK.map((black) => ({
          ...key(base + black.semitone),
          at: black.at,
        })),
      });
    }
    return list;
  }

  get canDown(): boolean {
    return this.base > LOWEST;
  }

  get canUp(): boolean {
    return this.base + 12 + this.span <= HIGHEST + 1;
  }

  shift = (by: number): void => {
    this.shifted = clampBase(this.base + by * 12, this.octaves);
  };

  isCurrent = (midi: number): boolean => this.nearest === midi;

  isDown = (midi: number): boolean => this.down === midi;

  // --- playing and setting -------------------------------------------------------------------------------------

  /** The pitch control's own range, so that a note out of it is held at its end. */
  #hzOf(midi: number): number {
    const meta = this.args.synth.pitch?.meta;
    const hz = noteToHz(midi);
    return meta?.kind === 'number'
      ? Math.min(meta.max, Math.max(meta.min, hz))
      : hz;
  }

  /** Sets the pitch to a note (when the source has a pitch control) and plays it. */
  #play(midi: number): void {
    const synth = this.args.synth;
    this.down = midi;
    this.lastPlayed = midi;
    const hz = this.#hzOf(midi);
    const grid = this.grid;
    if (this.#target !== null && grid) {
      // a step is chosen: the note goes to the step (the pattern the grids show), not to the pitch
      this.audio.setStep(
        this.args.scopeId,
        grid.name,
        this.#target,
        midi,
        this.#gesture,
      );
    } else if (synth.pitch && !synth.playsNote && this.selected === null) {
      this.audio.setControl(
        this.args.scopeId,
        synth.pitch.key,
        hz,
        this.#gesture,
      );
    }
    this.#held = true;
    void this.audio
      .playNote(this.args.scopeId, synth.nodeId, {
        midi,
        hz,
        param: synth.pitchParam,
      })
      .then(() => {
        // (the finger came up while the audio was starting)
        if (!this.#held)
          this.audio.releaseNote(this.args.scopeId, synth.nodeId);
      });
  }

  #stop(): void {
    this.#held = false;
    this.down = null;
    this.#gesture = undefined;
    this.#next();
    this.audio.releaseNote(this.args.scopeId, this.args.synth.nodeId);
  }

  /** After a note was given to a step: on to the next, wrapping. */
  #next(): void {
    const grid = this.grid;
    if (this.#target !== null && grid && grid.steps.length > 0) {
      this.chosen = (this.#target + 1) % grid.steps.length;
    }
    this.#target = null;
  }

  #midiAt(event: PointerEvent): number | null {
    const found = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>('[data-midi]');
    const midi = found ? Number(found.dataset['midi']) : NaN;
    return Number.isFinite(midi) ? midi : null;
  }

  onPointerDown = (event: PointerEvent): void => {
    if (event.button > 0 || this.#pointer !== null) return;
    const midi = this.#midiAt(event);
    if (midi === null) return;
    event.preventDefault();
    this.#pointer = event.pointerId;
    try {
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    } catch {
      // (the browser would not capture: moves outside are then not followed)
    }
    (event.currentTarget as HTMLElement).focus({ preventScroll: true });
    this.#gesture = `note-${++this.#group}`;
    this.#target = this.selected;
    this.#play(midi);
  };

  onPointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.#pointer) return;
    const midi = this.#midiAt(event);
    if (midi !== null && midi !== this.down) this.#play(midi);
  };

  onPointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.#pointer) return;
    this.#pointer = null;
    this.#stop();
  };

  /** Arrows move the pitch a semitone (a step to undo each); Enter and Space play the note held down. */
  onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault();
      this.shift(event.key === 'PageUp' ? 1 : -1);
      return;
    }
    if (this.selected !== null) {
      if (this.stepKey(event)) return;
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        return;
      }
    }
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowUp'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowDown'
          ? -1
          : 0;
    if (step !== 0) {
      event.preventDefault();
      const next = Math.min(
        HIGHEST,
        Math.max(
          LOWEST,
          (this.nearest ?? 60) + step * (event.shiftKey ? 12 : 1),
        ),
      );
      this.#gesture = `note-${++this.#group}`;
      this.#play(next);
      // a tap of the arrow is a short note
      this.#stop();
      return;
    }
    if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
      event.preventDefault();
      if (this.selected !== null && this.nearest === null) return; // a rest
      this.#gesture = `note-${++this.#group}`;
      this.#play(this.nearest ?? 60);
    }
  };

  // --- the steps ------------------------------------------------------------------------------------------------

  /** The sequence whose steps are shown: the one chosen for this track, else the first with a grid. */
  get grids(): StepGridView[] {
    return this.audio.stepGrids(this.args.scopeId);
  }

  get grid(): StepGridView | undefined {
    const chosen = this.view.chosenStepSequence(this.args.scopeId);
    return this.grids.find((grid) => grid.name === chosen) ?? this.grids[0];
  }

  get severalGrids(): boolean {
    return this.grids.length > 1;
  }

  get gridChoices(): { value: string; label: string }[] {
    return this.grids.map((grid) => ({ value: grid.name, label: grid.label }));
  }

  chooseGrid = (event: Event): void => {
    this.chosen = null;
    this.view.chooseStepSequence(
      this.args.scopeId,
      (event.target as HTMLSelectElement).value,
    );
  };

  /** The chosen step, if it is still in the sequence. */
  get selected(): number | null {
    const at = this.chosen;
    const length = this.grid?.steps.length ?? 0;
    return at !== null && at < length ? at : null;
  }

  get hasSelected(): boolean {
    return this.selected !== null;
  }

  /** Tapping a step chooses it; tapping it again lets go. `on`: the double click that opens its value box chooses it. */
  pick = (index: number, on?: boolean): void => {
    this.chosen = on === true || this.chosen !== index ? index : null;
  };

  /** Clears the chosen step to a rest and moves on. One undo step. */
  rest = (): void => {
    const at = this.selected;
    const grid = this.grid;
    if (at === null || !grid) return;
    this.audio.setStep(
      this.args.scopeId,
      grid.name,
      at,
      0,
      `note-${++this.#group}`,
    );
    this.chosen = (at + 1) % grid.steps.length;
  };

  /** Keys that work on the chosen step, from the keyboard or the strip. True if the key was one. */
  stepKey = (event: KeyboardEvent): boolean => {
    const at = this.selected;
    const length = this.grid?.steps.length ?? 0;
    if (at === null || length === 0) return false;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      this.chosen =
        (at + (event.key === 'ArrowRight' ? 1 : -1) + length) % length;
      return true;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.chosen = null;
      return true;
    }
    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      this.rest();
      return true;
    }
    return false;
  };

  onStripKey = (event: KeyboardEvent): void => {
    if (this.stepKey(event)) {
      const cell = (
        event.currentTarget as HTMLElement
      ).querySelectorAll<HTMLElement>('[data-test-step]')[this.chosen ?? -1];
      cell?.focus({ preventScroll: true });
    }
  };

  onKeyUp = (event: KeyboardEvent): void => {
    if ((event.key === 'Enter' || event.key === ' ') && this.#held) {
      event.preventDefault();
      this.#stop();
    }
  };

  onBlur = (): void => {
    if (this.#held) this.#stop();
  };

  willDestroy(): void {
    super.willDestroy();
    if (this.#held) this.#stop();
  }

  // --- the rest of the bar --------------------------------------------------------------------------------------

  get several(): boolean {
    return (this.args.others?.length ?? 0) > 1;
  }

  get otherChoices(): { value: string; label: string }[] {
    return (this.args.others ?? []).map((other) => ({
      value: other.key,
      label: other.label,
    }));
  }

  chooseOther = (event: Event): void => {
    this.args.onChoose?.((event.target as HTMLSelectElement).value);
  };

  showInScript = (): void => {
    const line = this.args.synth.line;
    if (line !== undefined) this.view.showInScript(this.args.scopeId, line);
  };

  <template>
    <div class="synth-box">
      <section
        class="synth"
        aria-label="{{@synth.label}} synth"
        data-test-synth={{@synth.nodeId}}
        ...attributes
      >
        <header class="synth__head">
          <h4 class="synth__title">
            <b>{{@synth.label}}</b>
            <span class="synth__type">{{@synth.type}}</span>
            {{#if @synth.byPosition}}
              <span
                class="control-group__hint"
                title="This source has no id in the script, so what is stored for it follows its position in the script."
              >no id</span>
            {{/if}}
          </h4>
          {{#if this.several}}
            <label class="waveform__field waveform__switch">
              <span class="sr-only">Source</span>
              <select
                class="select waveform__select"
                data-test-source-picker
                {{on "change" this.chooseOther}}
                {{selectOptions this.otherChoices @synth.key}}
              ></select>
            </label>
          {{/if}}
          <span class="synth__tools">
            <Hint @label="About the synth editor" data-test-synth-hint>
              <p>The trace is the source’s own output, steadied on a rising zero
                crossing. The keyboard sets the pitch (the same value a
                note-mode slider holds) and plays the note while you hold it:
                drag across keys to glide, or use the arrow keys, and Enter or
                Space to play. The octave changes only with the − and + buttons,
                or PageDown and PageUp on the keyboard.</p>
              {{#if this.grid}}
                <p data-test-steps-hint>Steps: a step’s value is passed to the
                  script as
                  <code>ev.value</code>; in the Synth template it is played as a
                  MIDI note, and 0 is a rest. Tap a step, then a key: the key’s
                  note goes to the step, it plays, and the next step is chosen,
                  so a line is entered by tapping keys in a row. Tap the step
                  again, or press Escape, to choose none. Arrow left and right
                  move the choice; Backspace or Delete (or Rest) clears it.</p>
              {{/if}}
              <p>The controls are the ones the script declares for this source:
                <code>slider('#osc', 'detune')</code>, or
                <code>controls()</code>
                for all of them.</p>
            </Hint>
            {{#if @synth.line}}
              <button
                type="button"
                class="btn btn--s btn--ghost btn--on-yellow"
                aria-label="Show this synth in the script"
                title="Show in script"
                data-test-show-in-script
                {{on "click" this.showInScript}}
              ><Icon @name="code" /></button>
            {{/if}}
          </span>
        </header>

        {{#unless @synth.noise}}
          <div class="synth__main">
            {{#if this.grid}}
              <div class="synth__steps" data-test-synth-steps>
                <div class="synth__stepbar">
                  <span class="synth__steplabel">Steps</span>
                  {{#if this.severalGrids}}
                    <label class="waveform__field synth__stepchoice">
                      <span class="sr-only">Sequence</span>
                      <select
                        class="select waveform__select"
                        data-test-step-sequence
                        {{on "change" this.chooseGrid}}
                        {{selectOptions this.gridChoices this.grid.name}}
                      ></select>
                    </label>
                  {{else}}
                    <span
                      class="synth__stepname truncate"
                    >{{this.grid.label}}</span>
                  {{/if}}
                  <button
                    type="button"
                    class="btn btn--s btn--on-yellow"
                    disabled={{if this.hasSelected false true}}
                    data-test-step-rest
                    {{on "click" this.rest}}
                  >Rest</button>
                </div>
                <StepGridWidget
                  class="synth__stepgrid"
                  @scopeId={{@scopeId}}
                  @control={{this.grid}}
                  @notes={{true}}
                  @selected={{this.selected}}
                  @onSelect={{this.pick}}
                  {{on "keydown" this.onStripKey}}
                />
              </div>
            {{/if}}

            {{#if this.hasKeyboard}}
              <div class="synth__keys" data-test-synth-keyboard>
                <div class="synth__keybar">
                  <button
                    type="button"
                    class="btn btn--s btn--on-yellow"
                    aria-label="Octave down"
                    disabled={{if this.canDown false true}}
                    data-test-octave-down
                    {{on "click" (fn this.shift -1)}}
                  >−</button>
                  <span
                    class="synth__range"
                    data-test-key-range
                  >{{this.range}}</span>
                  <button
                    type="button"
                    class="btn btn--s btn--on-yellow"
                    aria-label="Octave up"
                    disabled={{if this.canUp false true}}
                    data-test-octave-up
                    {{on "click" (fn this.shift 1)}}
                  >+</button>
                  <output
                    class="synth__readout"
                    aria-live="off"
                    data-test-pitch-readout
                  >{{this.readout}}</output>
                </div>
                {{! template-lint-disable no-pointer-down-event-binding no-invalid-interactive }}
                {{! a note starts when the pointer goes down, and follows it across the keys until it comes up }}
                <div
                  class="piano"
                  role="slider"
                  tabindex="0"
                  aria-label="{{@synth.label}} pitch"
                  aria-orientation="horizontal"
                  aria-valuemin="{{LOWEST}}"
                  aria-valuemax="{{HIGHEST}}"
                  aria-valuenow={{this.nearest}}
                  aria-valuetext={{this.readout}}
                  data-test-piano
                  {{measure this.setOctaves}}
                  {{on "pointerdown" this.onPointerDown}}
                  {{on "pointermove" this.onPointerMove}}
                  {{on "pointerup" this.onPointerUp}}
                  {{on "pointercancel" this.onPointerUp}}
                  {{on "keydown" this.onKeyDown}}
                  {{on "keyup" this.onKeyUp}}
                  {{on "blur" this.onBlur}}
                >
                  {{#each this.octavesShown key="base" as |octave|}}
                    <div class="piano__octave">
                      {{#each octave.white key="midi" as |white|}}
                        <span
                          class="piano__key piano__key--white"
                          data-midi={{white.midi}}
                          data-note={{white.name}}
                          data-current={{if (this.isCurrent white.midi) "true"}}
                          data-down={{if (this.isDown white.midi) "true"}}
                          data-test-key={{white.name}}
                        >{{#if white.label}}<span
                              class="piano__label"
                            >{{white.label}}</span>{{/if}}</span>
                      {{/each}}
                      {{#each octave.black key="midi" as |black|}}
                        <span
                          class="piano__key piano__key--black piano__key--after-{{black.at}}"
                          data-midi={{black.midi}}
                          data-note={{black.name}}
                          data-current={{if (this.isCurrent black.midi) "true"}}
                          data-down={{if (this.isDown black.midi) "true"}}
                          data-test-key={{black.name}}
                        ></span>
                      {{/each}}
                    </div>
                  {{/each}}
                </div>
                <p
                  class="synth__status"
                  role="status"
                  data-test-pitch-status
                >{{this.perStepText}}</p>
              </div>
            {{else}}
              <p class="synth__status" role="status" data-test-no-pitch>This
                source has no pitch to set.</p>
            {{/if}}
          </div>
        {{/unless}}

        <div class="synth__side">
          {{#if @synth.noise}}
            {{! a noise source has a picture, not an editor: nothing here is drawn per frame }}
            <div class="synth__noise" data-test-synth-noise>
              <svg
                class="synth__noise-bars"
                viewBox="0 0 96 24"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {{#each NOISE_BARS as |bar|}}
                  <rect x={{bar.x}} y={{bar.y}} width="1.5" height={{bar.h}} />
                {{/each}}
              </svg>
              <span class="synth__noise-word">noise</span>
            </div>
          {{else}}
            <div class="synth__scope" data-test-synth-scope>
              <canvas
                class="synth__canvas"
                role="img"
                aria-label="{{@synth.label}} waveform, live"
                {{showScope this.scope @scopeId @synth.nodeId}}
              ></canvas>
            </div>
          {{/if}}
          <SourceControls @scopeId={{@scopeId}} @nodeId={{@synth.nodeId}} />
        </div>
      </section>
    </div>
  </template>
}

/** The lowest C a keyboard of this many octaves may start on, so that it stays inside C0 to B8. */
function clampBase(base: number, octaves: number): number {
  return Math.min(HIGHEST + 1 - octaves * 12, Math.max(LOWEST, base));
}
