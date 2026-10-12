import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const KEYS = 36; // three octaves
const MAX_LOW = 108 - KEYS;

const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi);

/**
 * A keyboard for an oscillator's frequency control: press a key to set the pitch. The control stays
 * the single source of truth (its slider, the script's `this.controls` and the piano all agree),
 * whatever unit it is in (Hz, half steps or cents).
 */
export default class ControlsPianoSurfaceComponent extends Component {
  // lowest key shown, a C; starts with the control's note in the middle octave
  @tracked lowNote = this.initialLow();

  initialLow() {
    const note = this.args.control.midiNote ?? 60;
    return clamp(Math.floor(note / 12) * 12 - 12, 0, MAX_LOW);
  }

  get highNote() {
    return this.lowNote + KEYS - 1;
  }

  get activeNote() {
    return this.args.control.midiNote;
  }

  get noteLabel() {
    const note = this.activeNote;
    if (!Number.isFinite(note)) return '';
    const nearest = Math.round(note);
    return `${NOTE_NAMES[((nearest % 12) + 12) % 12]}${Math.floor(nearest / 12) - 1}`;
  }

  get canGoDown() {
    return this.lowNote > 0;
  }

  get canGoUp() {
    return this.lowNote < MAX_LOW;
  }

  @action
  select(note) {
    this.args.control.setMidiNote(note);
  }

  @action
  shiftOctave(direction) {
    this.lowNote = clamp(this.lowNote + 12 * direction, 0, MAX_LOW);
  }
}
