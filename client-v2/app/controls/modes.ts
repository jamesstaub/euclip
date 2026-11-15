/**
 * Control modes: the unit a control works in. A mode says how a control's travel (a position from 0 to
 * 1) maps to a parameter's value, how the value is written and read as text, and how far one step of
 * the keys moves. Pure functions, shared by every control (slider, knob, the number entry) so they all
 * agree.
 *
 * The stored value is always in the parameter's own unit (Hz, seconds, a gain factor, a speed ratio).
 * A mode changes how a control travels and what it displays, never the sound: a frequency shown as a
 * note is still stored in Hz, a time shown in steps is still stored in seconds.
 *
 * Which modes a control offers comes from the parameter's metadata (`availableModes`): its unit first,
 * its curve and range, and, only where cracked-up's metadata does not say enough, its name.
 */

export type ModeName =
  // any number
  | 'linear'
  | 'exponential'
  | 'stepped'
  // a frequency
  | 'hz'
  | 'note'
  | 'cents'
  // a level
  | 'decibels'
  // a time
  | 'seconds'
  | 'ms'
  | 'steps'
  // a place in a sample
  | 'percent'
  | 'slice'
  // a playback speed
  | 'ratio'
  | 'semitones'
  | 'ratio-cents';

export const MODE_LABELS: Readonly<Record<ModeName, string>> = {
  linear: 'Linear',
  exponential: 'Exponential',
  stepped: 'Stepped',
  hz: 'Hz',
  note: 'Note',
  cents: 'Note and cents',
  decibels: 'Decibels',
  seconds: 'Seconds',
  ms: 'Milliseconds',
  steps: 'Steps (tempo)',
  percent: 'Percent of the sample',
  slice: 'Slice',
  ratio: 'Ratio',
  semitones: 'Semitones',
  'ratio-cents': 'Cents',
};

/** What a mode needs to know about the parameter, and about what is live around it. */
export interface Range {
  min: number;
  max: number;
  /** the parameter's unit as cracked-up names it (`hz`, `gain`, `seconds`, `none`, ...) */
  unit?: string;
  /** how the parameter travels between its ends, as cracked-up names it: `linear`, `log`, `exp` */
  curve?: string;
  /** stepped mode: the distance between values (default 1) */
  step?: number;
  /** stepped mode: the only values allowed, in order, instead of a step */
  values?: readonly number[];
  /**
   * Limits inside min..max that the value is held to without changing the travel: a sampler's start
   * stops at its end, though both controls run the length of the sample.
   */
  floor?: number;
  ceiling?: number;
  /** `steps`: how long one step of the track's sequence lasts now, in seconds (it follows the tempo) */
  stepSeconds?: number;
  /** `percent`: the length of the sample the parameter is a place in, in seconds */
  duration?: number;
  /** `slice`: the sample's slice boundaries in seconds, from 0 to its length */
  slices?: readonly number[];
  /** `slice`: whether the parameter is where a slice begins or where one ends */
  edge?: 'start' | 'end';
}

export interface Mapping {
  readonly mode: ModeName;
  /** 0..1 for a value (values outside the range are held at its ends) */
  toPosition(value: number): number;
  /** the value at a position (positions outside 0..1 are held at its ends) */
  toValue(position: number): number;
  /** the value as text, with its unit: `2 kHz`, `A4`, `-6.0 dB`, `250 ms` */
  format(value: number): string;
  /** the value a person typed, or null when it cannot be read. Held inside the range. */
  parse(text: string): number | null;
  /** how far one arrow-key press moves, as a position */
  readonly keyStep: number;
  /** the control moves in whole steps of its unit (notes, semitones, slices): Shift cannot go finer */
  readonly discrete: boolean;
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
    discrete: false,
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
    discrete: true,
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
    discrete: false,
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
      discrete: true,
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
    discrete: true,
    bipolar: min < 0 && max > 0 && Math.abs(min + max) < 1e-9,
  };
}

// --- units: the same parameter, said another way -------------------------------------------------------

/** The travel a parameter's own curve asks for: even ratios for `log` and `exp`, else even steps. */
function natural(range: Range): Mapping {
  return range.curve === 'log' || range.curve === 'exp'
    ? exponential(range)
    : linear(range);
}

/** Rounds away the noise a conversion there and back leaves (0.30000000000000004). */
const tidy = (value: number): number => Number(value.toPrecision(12));

const signed = (value: number, digits = 3): string =>
  `${value > 0 ? '+' : ''}${trim(value, digits)}`;

/** A number with an optional unit after it: `250`, `250ms`, `0.25 s`. The unit comes back lower-cased. */
function parseWithSuffix(
  text: string,
): { value: number; suffix: string } | null {
  const match =
    /^\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?)\s*([a-z%×]*)\s*$/i.exec(text);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value)
    ? { value, suffix: match[2]!.toLowerCase() }
    : null;
}

interface UnitSpec {
  /** the parameter's value in this unit, and back */
  to(value: number): number;
  from(amount: number): number;
  format(amount: number): string;
  /** what was typed, as an amount of this unit; null when it cannot be read */
  parse(text: string): number | null;
  /** the travel is even in this unit (semitones along a speed), not the parameter's own curve */
  even?: boolean;
  /** the control only stops on multiples of this much of the unit */
  snap?: number;
  /** how much of the unit one arrow-key press moves */
  key?: number;
}

/** A mode that shows the parameter in another unit. The value stays in the parameter's own. */
function inUnit(mode: ModeName, range: Range, spec: UnitSpec): Mapping {
  const { min, max } = range;
  const base = natural(range);
  const low = spec.to(min);
  const high = spec.to(max);
  const span = high - low || 1;
  const snapped = (amount: number): number =>
    spec.snap ? Math.round(amount / spec.snap) * spec.snap : amount;
  const back = (amount: number): number =>
    clamp(tidy(spec.from(snapped(amount))), min, max);
  const key = spec.key ?? spec.snap;
  return {
    mode,
    toPosition: (value) =>
      spec.even
        ? clamp01((spec.to(clamp(value, min, max)) - low) / span)
        : base.toPosition(value),
    toValue: (position) =>
      spec.even
        ? back(low + span * clamp01(position))
        : back(spec.to(base.toValue(position))),
    format: (value) => spec.format(tidy(spec.to(value))),
    parse: (text) => {
      const amount = spec.parse(text);
      return amount === null || !Number.isFinite(amount) ? null : back(amount);
    },
    keyStep: key ? clamp(key / Math.abs(span), 1e-4, 0.25) : base.keyStep,
    discrete: spec.snap !== undefined,
    bipolar: false,
  };
}

const plain = (text: string): number | null =>
  parseWithSuffix(text)?.value ?? null;

function hz(range: Range): Mapping {
  return { ...natural({ ...range, unit: 'hz' }), mode: 'hz', bipolar: false };
}

/** A pitch to the cent, written as the nearest note and how far from it: `A4 +13 ct`. */
function cents(range: Range): Mapping {
  const floor = Math.max(range.min, 8.18);
  return inUnit(
    'cents',
    { ...range, min: floor },
    {
      even: true,
      key: 10,
      to: (value) => 100 * hzToNote(Math.max(value, 1e-6)),
      from: (amount) => noteToHz(amount / 100),
      format: (amount) => {
        const nearest = Math.round(amount / 100);
        const off = Math.round(amount - nearest * 100);
        return off === 0
          ? noteName(nearest)
          : `${noteName(nearest)} ${signed(off)} ct`;
      },
      parse: (text) => {
        const named =
          /^\s*([a-g]\s*[#b]?\s*-?\d+)\s*(?:([+-]\s*\d+\.?\d*)\s*(?:ct|c|cents)?)?\s*$/i.exec(
            text,
          );
        if (named) {
          const whole = parseNote(named[1]!);
          if (whole === null) return null;
          return (
            whole * 100 + (named[2] ? Number(named[2].replace(/\s+/g, '')) : 0)
          );
        }
        return plain(text); // a bare number is cents: 6900 is A4
      },
    },
  );
}

function seconds(range: Range): Mapping {
  return inUnit('seconds', range, {
    to: (value) => value,
    from: (amount) => amount,
    format: (amount) => `${trim(amount)} s`,
    parse: (text) => {
      const typed = parseWithSuffix(text);
      if (!typed) return null;
      return typed.suffix === 'ms' ? typed.value / 1000 : typed.value;
    },
  });
}

function milliseconds(range: Range): Mapping {
  return inUnit('ms', range, {
    to: (value) => value * 1000,
    from: (amount) => amount / 1000,
    format: (amount) => `${trim(amount, 4)} ms`,
    parse: (text) => {
      const typed = parseWithSuffix(text);
      if (!typed) return null;
      return typed.suffix === 's' ? typed.value * 1000 : typed.value;
    },
  });
}

/** How finely a time in steps moves: a quarter of a step. */
export const STEP_GRAIN = 0.25;

/** A time as steps of the track's sequence at the tempo now, a quarter of a step at a time. */
function steps(range: Range): Mapping {
  const one =
    range.stepSeconds && range.stepSeconds > 0 ? range.stepSeconds : 1;
  return inUnit('steps', range, {
    even: true,
    snap: STEP_GRAIN,
    to: (value) => value / one,
    from: (amount) => amount * one,
    format: (amount) => `${trim(amount, 4)} ${amount === 1 ? 'step' : 'steps'}`,
    parse: plain,
  });
}

/** A place in a sample as a share of its length. */
function percent(range: Range): Mapping {
  const length =
    range.duration && range.duration > 0 ? range.duration : range.max || 1;
  return inUnit('percent', range, {
    even: true,
    key: 1,
    to: (value) => (value / length) * 100,
    from: (amount) => (amount / 100) * length,
    format: (amount) => `${trim(amount, 4)}%`,
    parse: plain,
  });
}

/**
 * A place in a sample as one of its slices, counted from 0 as `trigger({ slice })` counts them. A start
 * is where that slice begins; an end is where that slice ends, so start and end on the same slice play
 * exactly that slice.
 */
function slice(range: Range): Mapping {
  const bounds =
    range.slices && range.slices.length >= 2
      ? range.slices
      : [range.min, range.max];
  const count = bounds.length - 1;
  const last = count - 1 || 1;
  const offset = range.edge === 'end' ? 1 : 0;
  const hold = (index: number): number =>
    clamp(Math.round(index), 0, count - 1);
  const indexOf = (value: number): number => {
    let best = 0;
    for (let index = 0; index < count; index++) {
      if (
        Math.abs(bounds[index + offset]! - value) <
        Math.abs(bounds[best + offset]! - value)
      )
        best = index;
    }
    return best;
  };
  const valueOf = (index: number): number =>
    clamp(bounds[hold(index) + offset]!, range.min, range.max);
  return {
    mode: 'slice',
    toPosition: (value) => (count > 1 ? indexOf(value) / last : 0),
    toValue: (position) => valueOf(clamp01(position) * last),
    format: (value) => `slice ${indexOf(value)}`,
    parse: (text) => {
      const typed = /^\s*(?:slice\s*)?(\d+)\s*$/i.exec(text);
      return typed ? valueOf(Number(typed[1])) : null;
    },
    keyStep: 1 / last,
    discrete: true,
    bipolar: false,
  };
}

/** A playback speed as a ratio: `2×` is twice as fast. */
function ratio(range: Range): Mapping {
  return inUnit('ratio', range, {
    to: (value) => value,
    from: (amount) => amount,
    format: (amount) => `${trim(amount)}×`,
    parse: plain,
  });
}

/** A playback speed as the pitch it gives, a semitone at a time: `+7 st`. */
function semitones(range: Range): Mapping {
  return inUnit('semitones', range, {
    even: true,
    snap: 1,
    to: (value) => 12 * Math.log2(Math.max(value, 1e-9)),
    from: (amount) => Math.pow(2, amount / 12),
    format: (amount) => `${signed(Math.round(amount))} st`,
    parse: plain,
  });
}

/** A playback speed as the pitch it gives, in cents: `+700 ct`. */
function ratioCents(range: Range): Mapping {
  return inUnit('ratio-cents', range, {
    even: true,
    key: 10,
    to: (value) => 1200 * Math.log2(Math.max(value, 1e-9)),
    from: (amount) => Math.pow(2, amount / 1200),
    format: (amount) => `${signed(Math.round(amount * 10) / 10, 5)} ct`,
    parse: plain,
  });
}

const MODES: Readonly<Record<ModeName, (range: Range) => Mapping>> = {
  linear,
  exponential,
  stepped,
  hz,
  note,
  cents,
  decibels,
  seconds,
  ms: milliseconds,
  steps,
  percent,
  slice,
  ratio,
  semitones,
  'ratio-cents': ratioCents,
};

/** The mapping for a mode over a range. */
export function mapping(mode: ModeName, range: Range): Mapping {
  const made = MODES[mode](range);
  if (range.floor === undefined && range.ceiling === undefined) return made;
  // limits inside the range: the travel is the range's, the value stops at the limits
  const low = Math.max(range.min, range.floor ?? range.min);
  const high = Math.max(low, Math.min(range.max, range.ceiling ?? range.max));
  return {
    ...made,
    toValue: (position) => clamp(made.toValue(position), low, high),
    parse: (text) => {
      const value = made.parse(text);
      return value === null ? null : clamp(value, low, high);
    },
  };
}

/** What cracked-up's parameter metadata says about a number parameter, and what is live around it. */
export interface NumberMeta extends Range {
  /** the parameter's name: the last resort, where the metadata does not say what the number is */
  name?: string;
}

/**
 * What kind of number a parameter is, as far as the units to offer go.
 *
 * Decided from cracked-up's metadata where that is enough:
 *   unit `hz`                      -> a frequency (sub-audio ones, an LFO's rate, have no note)
 *   unit `gain`                    -> a level
 *   unit `seconds`                 -> a time; or, when the host has supplied the length of the sample
 *                                     it is a place in (`duration`, see controls/live-range.ts), a
 *                                     place in a sample
 * and from the name where it is not:
 *   unit `ratio`, named `speed`, `rate` or `playbackRate` -> a playback speed. (A compressor's `ratio`
 *                                     has the same unit and is nothing of the kind.)
 */
export type Family =
  'frequency' | 'level' | 'time' | 'place' | 'speed' | 'plain';

const SPEED_NAMES: readonly string[] = ['speed', 'rate', 'playbackrate'];
/** Below this a frequency is a rate, not a pitch: no notes for an LFO. */
const AUDIBLE_HZ = 100;

export function familyOf(meta: NumberMeta): Family {
  if (meta.values?.length || (meta.step !== undefined && meta.step > 0))
    return 'plain';
  switch (meta.unit) {
    case 'hz':
      return 'frequency';
    case 'gain':
      return 'level';
    case 'seconds':
      return meta.duration !== undefined && meta.duration > 0
        ? 'place'
        : 'time';
    case 'ratio':
      return meta.min > 0 &&
        SPEED_NAMES.includes((meta.name ?? '').toLowerCase())
        ? 'speed'
        : 'plain';
    default:
      return 'plain';
  }
}

/** The mode a control starts in, from the parameter's own metadata. */
export function defaultMode(meta: NumberMeta): ModeName {
  switch (familyOf(meta)) {
    case 'frequency':
      return 'hz';
    case 'level':
      return 'linear';
    case 'time':
    case 'place':
      return 'seconds';
    case 'speed':
      return 'ratio';
    case 'plain':
      if (meta.values?.length || (meta.step !== undefined && meta.step > 0))
        return 'stepped';
      return meta.curve === 'log' || meta.curve === 'exp'
        ? 'exponential'
        : 'linear';
  }
}

/** The modes that make sense for a parameter, the default first. */
export function availableModes(meta: NumberMeta): ModeName[] {
  switch (familyOf(meta)) {
    case 'frequency':
      return meta.max >= AUDIBLE_HZ ? ['hz', 'note', 'cents'] : ['hz'];
    case 'level':
      return ['linear', 'decibels'];
    case 'time':
      return meta.stepSeconds && meta.stepSeconds > 0
        ? ['seconds', 'ms', 'steps']
        : ['seconds', 'ms'];
    case 'place': {
      const modes: ModeName[] = ['seconds', 'ms'];
      if (meta.stepSeconds && meta.stepSeconds > 0) modes.push('steps');
      modes.push('percent');
      if (meta.slices && meta.slices.length > 2) modes.push('slice');
      return modes;
    }
    case 'speed':
      return ['ratio', 'semitones', 'ratio-cents'];
    case 'plain': {
      const modes: ModeName[] = ['linear', 'exponential', 'stepped'];
      const first = defaultMode(meta);
      return [first, ...modes.filter((mode) => mode !== first)];
    }
  }
}

export function isModeName(value: unknown): value is ModeName {
  return typeof value === 'string' && value in MODES;
}
