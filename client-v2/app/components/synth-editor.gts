import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { isDestroyed, isDestroying } from '@ember/destroyable';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import { modifier } from 'ember-modifier';
import Icon from 'client-v2/components/icon';
import SourceControls from 'client-v2/components/source-controls';
import LaneButton from 'client-v2/components/lane-button';
import LaneSwitch from 'client-v2/components/lane-switch';
import SourceLane, {
  aimedControl,
  sourceLanes,
} from 'client-v2/components/source-lane';
import Hint from 'client-v2/components/ui/hint';
import type { ControlView, SynthView } from 'client-v2/audio/runner';
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
  @tracked octaves = 2;
  /** the key a finger or key is holding down */
  @tracked down: number | null = null;
  /** a synth macro keeps no pitch: the note it was last played at */
  @tracked private lastPlayed: number | null = null;

  #held = false;
  #group = 0;
  #gesture: string | undefined;
  #pointer: number | null = null;

  constructor(owner: unknown, args: SynthEditorSignature['Args']) {
    super(owner as never, args);
    const around = this.pitchNote ?? 48;
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

  /** What the keyboard marks: the pitch. */
  get exact(): number | null {
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
    if (nearest === null) return this.args.synth.playsNote ? 'No note yet' : '';
    const cents = this.cents;
    const text = `${noteName(nearest)}${cents === 0 ? '' : ` ${cents > 0 ? '+' : '−'}${Math.abs(cents)} ct`}`;
    const hz = this.hz;
    return hz === null || this.args.synth.playsNote
      ? text
      : `${text} · ${hz < 100 ? hz.toFixed(2) : hz.toFixed(1)} Hz`;
  }

  /** The control whose lane the lane switch shows: the one last touched, else the pitch. */
  get laneControl(): ControlView | undefined {
    const pitch = this.args.synth.pitch;
    return aimedControl(
      this.audio,
      this.view,
      this.args.scopeId,
      this.args.synth.nodeId,
      pitch ? [pitch.key] : [],
    );
  }

  get laneOpen(): boolean {
    return this.view.sourceLane(this.args.scopeId) !== null;
  }

  /** Some control of the synth has steps of their own: the steps button is blue. */
  get lanesSet(): boolean {
    return sourceLanes(
      this.audio,
      this.args.scopeId,
      this.args.synth.nodeId,
    ).some((lane) => lane.active);
  }

  showPicture = (): void => {
    this.view.setSourceLane(this.args.scopeId, null);
  };

  showLanes = (): void => {
    const control = this.laneControl;
    if (!this.laneOpen && control) {
      this.view.setSourceLane(this.args.scopeId, control.key);
    }
  };

  /** With no keyboard, one lane button: the lane under the controls, or none. */
  toggleLanes = (): void => {
    if (this.laneOpen) this.showPicture();
    else this.showLanes();
  };

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
    if (synth.pitch && !synth.playsNote) {
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
    this.audio.releaseNote(this.args.scopeId, this.args.synth.nodeId);
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
      this.#gesture = `note-${++this.#group}`;
      this.#play(this.nearest ?? 60);
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
              <p data-test-steps-hint>The steps button (beside the octave
                buttons) shows the pitch on every step in the keyboard’s place:
                drag the bars to make a melody. A step with a pitch of its own
                plays it; the others play the keyboard’s.</p>
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
            {{#if this.hasKeyboard}}
              <div class="synth__keys" data-test-synth-keyboard>
                <div class="synth__keybar">
                  {{#if this.laneControl}}
                    <LaneSwitch
                      class="synth__lane-switch"
                      @picture="Keyboard"
                      @icon="keys"
                      @control={{this.laneControl}}
                      @open={{this.laneOpen}}
                      @active={{this.lanesSet}}
                      @onPicture={{this.showPicture}}
                      @onLanes={{this.showLanes}}
                    />
                  {{/if}}
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
                <div class="synth__keyboard">
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
                            data-current={{if
                              (this.isCurrent white.midi)
                              "true"
                            }}
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
                            data-current={{if
                              (this.isCurrent black.midi)
                              "true"
                            }}
                            data-down={{if (this.isDown black.midi) "true"}}
                            data-test-key={{black.name}}
                          ></span>
                        {{/each}}
                      </div>
                    {{/each}}
                  </div>
                  {{! the one multislider open over the source: in the keyboard's place }}
                  <SourceLane @scopeId={{@scopeId}} @nodeId={{@synth.nodeId}} />
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
          {{#unless this.hasKeyboard}}
            {{! (no keyboard to lay it over: under the controls, shown by a lane button of its own) }}
            {{#if this.laneControl}}
              <LaneButton
                class="synth__lane-button"
                @control={{this.laneControl}}
                @pressed={{this.laneOpen}}
                @active={{this.lanesSet}}
                @onToggle={{this.toggleLanes}}
              />
            {{/if}}
            <SourceLane
              class="source-lane--inline"
              @scopeId={{@scopeId}}
              @nodeId={{@synth.nodeId}}
            />
          {{/unless}}
        </div>
      </section>
    </div>
  </template>
}

/** The lowest C a keyboard of this many octaves may start on, so that it stays inside C0 to B8. */
function clampBase(base: number, octaves: number): number {
  return Math.min(HIGHEST + 1 - octaves * 12, Math.max(LOWEST, base));
}
