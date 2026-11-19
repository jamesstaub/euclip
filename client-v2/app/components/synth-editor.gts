import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { isDestroyed, isDestroying } from '@ember/destroyable';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import { modifier } from 'ember-modifier';
import Icon from 'client-v2/components/icon';
import SourceControls from 'client-v2/components/source-controls';
import Hint from 'client-v2/components/ui/hint';
import type { SynthView } from 'client-v2/audio/runner';
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

  /** the lowest C showing; undefined until the person shifts it: it follows the pitch */
  @tracked private shifted: number | undefined;
  @tracked octaves = 2;
  /** the key a finger or key is holding down */
  @tracked down: number | null = null;
  /** a synth macro keeps no pitch: the note it was last played at */
  @tracked private lastPlayed: number | null = null;

  #held = false;
  #group = 0;
  #gesture: string | undefined;
  #pointer: number | null = null;

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

  /** The pitch as a note number, with the fraction: null when there is none to show. */
  get exact(): number | null {
    if (this.args.synth.playsNote) return this.lastPlayed;
    const hz = this.hz;
    return hz === null ? null : hzToNote(hz);
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

  get hasKeyboard(): boolean {
    return this.args.synth.pitch !== null || this.args.synth.playsNote;
  }

  /** The pitch has a value for every step: the keyboard sets the control's single value and says so. */
  get perStep(): boolean {
    return this.args.synth.pitch?.perStep !== undefined;
  }

  get perStepText(): string | null {
    const per = this.args.synth.pitch?.perStep;
    if (!per) return null;
    return per.missing
      ? 'Pitch is per step, but its sequence is not in the script: the keys set its single value.'
      : `Pitch is per step of ${per.sequence}: the keys set its single value, not the lane.`;
  }

  // --- the keys ------------------------------------------------------------------------------------------------

  get base(): number {
    if (this.shifted !== undefined) return this.shifted;
    const around = this.nearest ?? 60;
    return clampBase(Math.floor(around / 12) * 12, this.octaves);
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
      const outside = next < this.base || next >= this.base + this.span;
      if (outside) {
        this.shifted = clampBase(Math.floor(next / 12) * 12, this.octaves);
      }
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
              crossing. The keyboard sets the pitch (the same value a note-mode
              slider holds) and plays the note while you hold it: drag across
              keys to glide, or use the arrow keys, and Enter or Space to play.</p>
            <p>The controls below are the ones the script declares for this
              source:
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

      <div class="synth__scope" data-test-synth-scope>
        <canvas
          class="synth__canvas"
          role="img"
          aria-label="{{@synth.label}} waveform, live"
          {{showScope this.scope @scopeId @synth.nodeId}}
        ></canvas>
      </div>

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
            <span class="synth__range" data-test-key-range>{{this.range}}</span>
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
        <p class="synth__status" role="status" data-test-no-pitch>This source
          has no pitch to set.</p>
      {{/if}}

      <SourceControls @scopeId={{@scopeId}} @nodeId={{@synth.nodeId}} />
    </section>
  </template>
}

/** The lowest C a keyboard of this many octaves may start on, so that it stays inside C0 to B8. */
function clampBase(base: number, octaves: number): number {
  return Math.min(HIGHEST + 1 - octaves * 12, Math.max(LOWEST, base));
}
