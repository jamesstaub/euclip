/**
 * Pattern generators for a step grid: Euclidean, binary, on/off and sieve, with the tools that turn a
 * pattern round. Every pattern here is made by cracked-up's own helpers (`cracked-up/util`); this
 * module only says what the dials are, fits what the helpers give to the grid's length, and keeps the
 * values steps already hold.
 *
 * A generator is a tool that writes into the grid's pattern. The pattern (what the project stores for
 * the grid) stays the only truth: nothing is computed from the dials when the script runs. The dials
 * of the generator last used are kept with the grid's stored options so its panel reopens where it
 * was, with the pattern it made (`made`), to tell whether steps have been changed by hand since.
 */
import {
  and,
  binaryPattern,
  binaryToNumber,
  countHits,
  euclid,
  invert,
  onOffPattern,
  or,
  patternToString,
  reverse,
  rotate,
  sieve,
  xor,
} from 'cracked-up/util';

export type GeneratorKind = 'euclid' | 'binary' | 'onoff' | 'sieve';
export type Combine = 'replace' | 'or' | 'and' | 'xor';

export const GENERATORS: readonly { id: GeneratorKind; label: string }[] = [
  { id: 'euclid', label: 'Euclidean' },
  { id: 'binary', label: 'Binary' },
  { id: 'onoff', label: 'On / off' },
  { id: 'sieve', label: 'Sieve' },
];

export const COMBINES: readonly { value: Combine; label: string }[] = [
  { value: 'replace', label: 'Replace' },
  { value: 'or', label: 'Or (add to)' },
  { value: 'and', label: 'And (keep where both)' },
  { value: 'xor', label: 'Xor (flip)' },
];

/** The dials, all of them: each generator reads its own. Plain data: it is stored with the grid. */
export interface GeneratorState {
  kind: GeneratorKind;
  /** Euclidean: how many hits, spread as evenly as the steps allow; and how far it is turned */
  hits: number;
  rotate: number;
  /** Binary: the number whose bits are the steps (the beats that are on, one after another) */
  number: number;
  /**
   * Binary's four beats, four digits each (0 to 15), the first the highest; -1 is a beat that is off,
   * no part of the number. The beats are what is set; `number` is made from them.
   */
  beats: Beats;
  /** On/off: so many on, so many off, repeated to fill */
  on: number;
  off: number;
  /** Sieve: "every `every`-th step, starting at step `from`", twice over; `every` 0 is a row not used */
  sieve: [[every: number, from: number], [every: number, from: number]];
  /** how what is generated meets what is already there */
  combine: Combine;
  /** the pattern the dials last made (as `x..x`), to tell a pattern changed by hand since */
  made?: string;
  /** what was there when the dials began to write: what Or, And and Xor combine with */
  base?: number[];
}

/**
 * The binary dial's range: 1 to 65535, so up to sixteen digits (a bar of sixteenths). The number's
 * digits are the pattern, and how many there are is the grid's length: 5 is `x.x`, three steps.
 */
export const BINARY_MIN = 1;
export const BINARY_MAX = 65535;

/** Binary's four beats: 0 to 15 each, or -1 for a beat that is off. */
export type Beats = [number, number, number, number];

export const BEAT_OFF = -1;

/**
 * The number the beats make: the digits of the beats that are on, one after another. All off is 0
 * (which the generator holds at 1).
 */
export function numberOfBeats(beats: readonly number[]): number {
  return beats.reduce(
    (value, beat) => (beat === BEAT_OFF ? value : value * 16 + beat),
    0,
  );
}

/**
 * A number as four beats: its sixteen digits four to a beat, the beats in front of its first digit off
 * (5 is off, off, off, 5; 1234 is off, 4, 13, 2).
 */
export function beatsOfNumber(value: number): Beats {
  const number = Math.min(BINARY_MAX, Math.max(BINARY_MIN, Math.round(value)));
  const beats = [0, 1, 2, 3].map((beat) => (number >> (4 * (3 - beat))) & 15);
  const first = beats.findIndex((beat) => beat > 0);
  return beats.map((beat, index) => (index < first ? BEAT_OFF : beat)) as Beats;
}

export function binaryMax(): number {
  return BINARY_MAX;
}

/** A number's binary digits, as the binary generator writes them (biggest first): 5 is `101`. */
export function binaryDigits(value: number): string {
  return binaryPattern(Math.max(BINARY_MIN, value)).join('');
}

const whole = (
  value: unknown,
  least: number,
  most: number,
  otherwise: number,
): number =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.min(most, Math.max(least, Math.round(value)))
    : otherwise;

/** Dials to start from for a pattern that has none: ones that would make something like it. */
export function defaultGenerator(steps: readonly number[]): GeneratorState {
  const number = Math.min(
    BINARY_MAX,
    Math.max(BINARY_MIN, binaryToNumber([...steps].slice(-16))),
  );
  return {
    kind: 'euclid',
    hits: countHits([...steps]),
    rotate: 0,
    number,
    beats: beatsOfNumber(number),
    on: 1,
    off: 3,
    sieve: [
      [4, 0],
      [0, 0],
    ],
    combine: 'replace',
  };
}

/** What is stored, read back: whatever is missing or out of range takes the default. Null if nothing is stored. */
export function readGenerator(
  value: unknown,
  steps: readonly number[],
): GeneratorState | null {
  if (typeof value !== 'object' || value === null) return null;
  const stored = value as Record<string, unknown>;
  const base = defaultGenerator(steps);
  const length = steps.length;
  const row = (index: number): [number, number] => {
    const rows = Array.isArray(stored['sieve']) ? stored['sieve'] : [];
    const pair = Array.isArray(rows[index]) ? (rows[index] as unknown[]) : [];
    const every = whole(pair[0], 0, length, base.sieve[index]![0]);
    return [every, whole(pair[1], 0, Math.max(0, every - 1), 0)];
  };
  return {
    kind: GENERATORS.some((entry) => entry.id === stored['kind'])
      ? (stored['kind'] as GeneratorKind)
      : base.kind,
    hits: whole(stored['hits'], 0, length, base.hits),
    rotate: whole(stored['rotate'], 0, Math.max(0, length - 1), 0),
    ...binaryOf(stored, base.number),
    on: whole(stored['on'], 0, length, base.on),
    off: whole(stored['off'], 0, length, base.off),
    sieve: [row(0), row(1)],
    combine: COMBINES.some((entry) => entry.value === stored['combine'])
      ? (stored['combine'] as Combine)
      : 'replace',
    ...(typeof stored['made'] === 'string' ? { made: stored['made'] } : {}),
    ...(Array.isArray(stored['base'])
      ? {
          base: stored['base'].map((step) =>
            typeof step === 'number' && Number.isFinite(step) ? step : 0,
          ),
        }
      : {}),
  };
}

/** Binary's beats as stored (else made from a stored number, as older projects have), and their number. */
function binaryOf(
  stored: Record<string, unknown>,
  otherwise: number,
): { number: number; beats: Beats } {
  const raw = stored['beats'];
  const beats =
    Array.isArray(raw) && raw.length === 4
      ? (raw.map((beat) => whole(beat, BEAT_OFF, 15, BEAT_OFF)) as Beats)
      : beatsOfNumber(
          whole(stored['number'], BINARY_MIN, BINARY_MAX, otherwise),
        );
  return { number: numberOfBeats(beats), beats };
}

/** Exactly `length` steps of a pattern: cut short, or filled out with rests. */
function fit(pattern: readonly number[], length: number): number[] {
  return Array.from({ length }, (_, index) => pattern[index] ?? 0);
}

/**
 * What the dials make, as hits (1) and rests (0), for a grid of `length` steps. Binary alone makes its
 * own length (its number's digits); the others fill the grid's.
 */
export function generate(state: GeneratorState, length: number): number[] {
  if (length <= 0) return [];
  switch (state.kind) {
    case 'euclid':
      return fit(euclid(state.hits, length, state.rotate), length);
    case 'binary':
      // The beats' number's own digits, no rests in front: 5 is x.x, and the grid becomes three steps
      // long.
      return binaryPattern(Math.max(BINARY_MIN, numberOfBeats(state.beats)));
    case 'onoff': {
      const group = state.on + state.off;
      // (the group, as many times as it takes to fill the grid; what runs over the end is cut off)
      return group <= 0
        ? fit([], length)
        : fit(
            onOffPattern(state.on, state.off, Math.ceil(length / group)),
            length,
          );
    }
    case 'sieve': {
      const classes = state.sieve
        .filter(([every]) => every > 0)
        .map(([every, from]) => [every, from] as const);
      return classes.length === 0
        ? fit([], length)
        : fit(sieve(length, ...classes), length);
    }
  }
}

/** A generated pattern met with what was there, by the library's own `or`, `and` and `xor`. */
export function combine(
  mode: Combine,
  base: readonly number[],
  generated: readonly number[],
): number[] {
  const length = generated.length;
  const there = fit(base, length);
  const made = [...generated];
  switch (mode) {
    case 'replace':
      return made;
    case 'or':
      return fit(or(there, made), length);
    case 'and':
      return fit(and(there, made), length);
    case 'xor':
      return fit(xor(there, made), length);
  }
}

/**
 * A pattern of hits and rests given the values steps hold: a step that is on keeps the value it has
 * (or had, before the dials began to write) when that is above 0; a new hit takes the value last used
 * on the grid (the last step above 0, as a tapped step does), so a track whose steps are notes is not
 * given note 1; and on a grid with no values at all, `fill` (1, or a note on a track that plays notes).
 * A step that is off is 0. So a grid of slice numbers keeps its slices where the rhythm still has a hit.
 */
export function keepValues(
  hits: readonly number[],
  current: readonly number[],
  base: readonly number[] = [],
  fill = 1,
): number[] {
  const last = (steps: readonly number[]) =>
    [...steps].reverse().find((value) => value > 0);
  const fresh = last(current) ?? last(base) ?? fill;
  return hits.map((hit, index) => {
    if (hit === 0) return 0;
    const now = current[index] ?? 0;
    if (now > 0) return now;
    const before = base[index] ?? 0;
    return before > 0 ? before : fresh;
  });
}

/** A pattern as text: `x..x..x.` (the library's own writing of it). */
export function written(steps: readonly number[]): string {
  return patternToString([...steps]);
}

/** Whether steps have been changed by hand since the dials last wrote (false where they never have). */
export function isEdited(
  state: GeneratorState | null,
  steps: readonly number[],
): boolean {
  return state?.made !== undefined && state.made !== written(steps);
}

/**
 * A dial was moved: the pattern the grid should now hold (Binary's is as long as its number's
 * digits, so the grid's length changes with it), and the dials as they are to be stored.
 * Hand edits are what is there when the dials begin again: they are the base that Or, And and Xor
 * combine with, and under Replace they are written over (the dial was moved; that is the request).
 */
export function applyGenerator(
  state: GeneratorState,
  current: readonly number[],
  fill = 1,
): { steps: number[]; generator: GeneratorState } {
  const generated = generate(state, current.length);
  const continuing =
    state.made !== undefined && state.made === written(current);
  // (kept whole, not cut to this length: Binary's next number may be longer again)
  const base = continuing ? [...(state.base ?? [])] : [...current];
  const hits = combine(state.combine, base, generated);
  const steps = keepValues(hits, current, base, fill);
  return { steps, generator: { ...state, made: written(steps), base } };
}

export type Tool = 'left' | 'right' | 'reverse' | 'invert';

/**
 * A tool on the pattern as it stands (the library's `rotate`, `reverse`, `invert`): same length, values
 * kept where steps stay on. Invert's new hits take a value as a generator's do (see `keepValues`).
 */
export function applyTool(
  tool: Tool,
  steps: readonly number[],
  fill = 1,
): number[] {
  const pattern = [...steps];
  switch (tool) {
    // (the library's `rotate` by 1 brings each step one place earlier: to the left)
    case 'left':
      return fit(rotate(pattern, 1), steps.length);
    case 'right':
      return fit(rotate(pattern, -1), steps.length);
    case 'reverse':
      return fit(reverse(pattern), steps.length);
    case 'invert':
      return keepValues(fit(invert(pattern), steps.length), steps, [], fill);
  }
}

/** "5 of 16": how many steps are on. */
export function hitsOf(steps: readonly number[]): number {
  return countHits([...steps]);
}
