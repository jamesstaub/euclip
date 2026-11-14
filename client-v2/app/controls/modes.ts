/**
 * Slider modes: how a control's travel (a position from 0 to 1) maps to a parameter's value, and how
 * the value is written and read as text. Pure functions, shared by every control (slider, knob, the
 * number entry) so they all agree.
 *
 * The stored value is always in the parameter's own unit. A mode changes how a control travels and what
 * it displays, never the sound.
 */

export type ModeName =
  'linear' | 'exponential' | 'note' | 'decibels' | 'stepped';

export const MODE_LABELS: Readonly<Record<ModeName, string>> = {
  linear: 'Linear',
  exponential: 'Exponential',
  note: 'MIDI note',
  decibels: 'Decibels',
  stepped: 'Stepped',
};

/** What a mode needs to know about the parameter. */
export interface Range {
  min: number;
  max: number;
  /** the parameter's unit as cracked-up names it (`hz`, `gain`, `seconds`, `none`, ...) */
  unit?: string;
  /** stepped mode: the distance between values (default 1) */
  step?: number;
  /** stepped mode: the only values allowed, in order, instead of a step */
  values?: readonly number[];
}

export interface Mapping {
  readonly mode: ModeName;
  /** 0..1 for a value (values outside the range are held at its ends) */
  toPosition(value: number): number;
  /** the value at a position (positions outside 0..1 are held at its ends) */
  toValue(position: number): number;
  /** the value as text, with its unit: `2 kHz`, `A4`, `-6.0 dB` */
  format(value: number): string;
  /** the value a person typed, or null when it cannot be read. Held inside the range. */
  parse(text: string): number | null;
  /** how far one arrow-key press moves, as a position */
  readonly keyStep: number;
  /** a control with the middle of its range at zero fills from the centre */
  readonly bipolar: boolean;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const clamp01 = (position: number): number => clamp(position, 0, 1);

/** At most `digits` significant digits, without trailing zeros. */
export function trim(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return String(value);
  if (value === 0) return '0';
  const magnitude = Math.floor(Math.log10(Math.abs(value)));
  const decimals = clamp(digits - 1 - magnitude, 0, 6);
  return String(Number(value.toFixed(decimals)));
}

const UNIT_SUFFIX: Readonly<Record<string, string>> = {
  hz: 'Hz',
  db: 'dB',
  seconds: 's',
  ms: 'ms',
  beats: 'beats',
  cents: 'ct',
  semitones: 'st',
};

/** A number with the parameter's unit: `440 Hz`, `2.5 kHz`, `0.8`. */
export function formatWithUnit(value: number, unit?: string): string {
  if (unit === 'hz' && Math.abs(value) >= 1000)
    return `${trim(value / 1000)} kHz`;
  const suffix = unit ? UNIT_SUFFIX[unit] : undefined;
  return suffix ? `${trim(value)} ${suffix}` : trim(value);
}

/** Reads `440`, `440hz`, `2.5k`, `2.5 kHz`. */
function parseNumber(text: string): number | null {
  const match =
    /^\s*(-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?)\s*(k)?\s*[a-z%]*\s*$/i.exec(text);
  if (!match) return null;
  const value = Number(match[1]) * (match[2] ? 1000 : 1);
  return Number.isFinite(value) ? value : null;
}

// --- notes -------------------------------------------------------------------------------------------

const NOTE_NAMES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];

export function hzToNote(hz: number): number {
  return 69 + 12 * Math.log2(hz / 440);
}

export function noteToHz(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

/** `A4` for 69, `C-1` for 0. */
export function noteName(note: number): string {
  const whole = Math.round(note);
  return `${NOTE_NAMES[((whole % 12) + 12) % 12]}${Math.floor(whole / 12) - 1}`;
}

/** Reads `A4`, `c#3`, `Bb2`, or a note number (`60`). */
export function parseNote(text: string): number | null {
  const named = /^\s*([a-g])\s*([#b]?)\s*(-?\d+)\s*$/i.exec(text);
  if (named) {
    const base = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }[
      named[1]!.toLowerCase()
    ]!;
    const accidental = named[2] === '#' ? 1 : named[2] === 'b' ? -1 : 0;
    return base + accidental + (Number(named[3]) + 1) * 12;
  }
  const number = /^\s*(\d+)\s*$/.exec(text);
  return number ? Number(number[1]) : null;
}

// --- decibels ----------------------------------------------------------------------------------------

/** The bottom of a decibel control's travel. Below it the control is at zero gain. */
export const DB_FLOOR = -60;

export function gainToDb(gain: number): number {
  return gain <= 0 ? -Infinity : 20 * Math.log10(gain);
}

export function dbToGain(db: number): number {
  return db === -Infinity ? 0 : Math.pow(10, db / 20);
}

// --- the modes -----------------------------------------------------------------------------------------

function linear(range: Range): Mapping {
  const { min, max } = range;
  const span = max - min || 1;
  return {
    mode: 'linear',
    toPosition: (value) => clamp01((value - min) / span),
    toValue: (position) => min + span * clamp01(position),
    format: (value) => formatWithUnit(value, range.unit),
    parse: (text) => {
      const value = parseNumber(text);
      return value === null ? null : clamp(value, min, max);
    },
    keyStep: 0.01,
    bipolar: min < 0 && max > 0 && Math.abs(min + max) < 1e-9,
  };
}

/**
 * Even ratios along the travel: each tenth of the way multiplies the value by the same amount, which is
 * how pitch and most times are heard. A range that starts at or below zero has no ratio to work with,
 * so there the travel is squared instead (fine at the bottom, coarse at the top).
 */
function exponential(range: Range): Mapping {
  const { min, max } = range;
  const base = linear(range);
  if (min > 0 && max > min) {
    const ratio = max / min;
    return {
      ...base,
      mode: 'exponential',
      bipolar: false,
      toPosition: (value) =>
        clamp01(Math.log(clamp(value, min, max) / min) / Math.log(ratio)),
      toValue: (position) => min * Math.pow(ratio, clamp01(position)),
    };
  }
  const span = max - min || 1;
  return {
    ...base,
    mode: 'exponential',
    bipolar: false,
    toPosition: (value) => Math.sqrt(clamp01((value - min) / span)),
    toValue: (position) => min + span * clamp01(position) ** 2,
  };
}

/** Whole MIDI notes: the control moves a semitone at a time, and the value is that note in Hz. */
function note(range: Range): Mapping {
  const lowest = Math.ceil(hzToNote(Math.max(range.min, 8.18)) - 1e-9);
  const highest = Math.max(lowest, Math.floor(hzToNote(range.max) + 1e-9));
  const span = highest - lowest || 1;
  const toNote = (hz: number): number =>
    clamp(Math.round(hzToNote(Math.max(hz, 1e-6))), lowest, highest);
  return {
    mode: 'note',
    toPosition: (value) => (toNote(value) - lowest) / span,
    toValue: (position) =>
      noteToHz(lowest + Math.round(clamp01(position) * span)),
    format: (value) => noteName(toNote(value)),
    parse: (text) => {
      const typed = parseNote(text);
      return typed === null ? null : noteToHz(clamp(typed, lowest, highest));
    },
    keyStep: 1 / span,
    bipolar: false,
  };
}

/** Even decibels along the travel, for levels. The very bottom of the travel is silence. */
function decibels(range: Range): Mapping {
  const { min, max } = range;
  const top = gainToDb(Math.max(max, 1e-6));
  const bottom = min > 0 ? gainToDb(min) : DB_FLOOR;
  const span = top - bottom || 1;
  return {
    mode: 'decibels',
    toPosition: (value) => {
      if (value <= 0 || gainToDb(value) <= bottom) return 0;
      return clamp01((gainToDb(value) - bottom) / span);
    },
    toValue: (position) => {
      const p = clamp01(position);
      if (p === 0) return Math.max(min, 0);
      return clamp(dbToGain(bottom + span * p), min, max);
    },
    format: (value) => {
      if (value <= 0) return '-∞ dB';
      const db = gainToDb(value);
      return `${db > 0 ? '+' : ''}${db.toFixed(1)} dB`;
    },
    parse: (text) => {
      if (/^\s*-\s*(∞|inf)/i.test(text)) return Math.max(min, 0);
      const db = /^\s*([+-]?(?:\d+\.?\d*|\.\d+))\s*(db)?\s*$/i.exec(text);
      return db ? clamp(dbToGain(Number(db[1])), min, max) : null;
    },
    keyStep: 0.5 / span,
    bipolar: false,
  };
}

/** Only certain values: whole numbers, multiples of a step, or a given list. */
function stepped(range: Range): Mapping {
  const { min, max } = range;
  const list =
    range.values && range.values.length > 0 ? [...range.values] : null;
  if (list) {
    const last = list.length - 1 || 1;
    const nearest = (value: number): number =>
      list.reduce(
        (best, _candidate, index) =>
          Math.abs(list[index]! - value) < Math.abs(list[best]! - value)
            ? index
            : best,
        0,
      );
    return {
      mode: 'stepped',
      toPosition: (value) => nearest(value) / last,
      toValue: (position) => list[Math.round(clamp01(position) * last)]!,
      format: (value) => formatWithUnit(value, range.unit),
      parse: (text) => {
        const value = parseNumber(text);
        return value === null ? null : list[nearest(value)]!;
      },
      keyStep: 1 / last,
      bipolar: false,
    };
  }
  const step = range.step && range.step > 0 ? range.step : 1;
  const count = Math.max(1, Math.round((max - min) / step));
  const snap = (value: number): number =>
    clamp(min + Math.round((value - min) / step) * step, min, max);
  return {
    mode: 'stepped',
    toPosition: (value) => clamp01((snap(value) - min) / (count * step)),
    toValue: (position) =>
      snap(min + Math.round(clamp01(position) * count) * step),
    format: (value) =>
      formatWithUnit(Number(snap(value).toFixed(6)), range.unit),
    parse: (text) => {
      const value = parseNumber(text);
      return value === null ? null : snap(value);
    },
    keyStep: 1 / count,
    bipolar: min < 0 && max > 0 && Math.abs(min + max) < 1e-9,
  };
}

const MODES: Readonly<Record<ModeName, (range: Range) => Mapping>> = {
  linear,
  exponential,
  note,
  decibels,
  stepped,
};

/** The mapping for a mode over a range. */
export function mapping(mode: ModeName, range: Range): Mapping {
  return MODES[mode](range);
}

/** What cracked-up's parameter metadata says about a number parameter, as far as modes care. */
export interface NumberMeta {
  min: number;
  max: number;
  unit?: string;
  curve?: string;
  step?: number;
}

/** The mode a control starts in, from the parameter's own metadata. */
export function defaultMode(meta: NumberMeta): ModeName {
  if (meta.step !== undefined && meta.step > 0) return 'stepped';
  if (meta.curve === 'log' || meta.curve === 'exp') return 'exponential';
  return 'linear';
}

/** The modes that make sense for a parameter, the default first. */
export function availableModes(meta: NumberMeta): ModeName[] {
  const modes: ModeName[] = ['linear', 'exponential'];
  if (meta.unit === 'hz') modes.push('note');
  if (
    meta.unit === 'gain' ||
    (meta.unit === 'none' && meta.min >= 0 && meta.max <= 4)
  ) {
    modes.push('decibels');
  }
  modes.push('stepped');
  const first = defaultMode(meta);
  return [first, ...modes.filter((mode) => mode !== first)];
}

export function isModeName(value: unknown): value is ModeName {
  return typeof value === 'string' && value in MODES;
}
