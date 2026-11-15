/**
 * The waveform editor's arithmetic: what stretch of the sound is in view, where a time is on screen at
 * any zoom, which handle a pointer is on, where a dragged point snaps. Pure functions over plain data,
 * with no canvas and no DOM, so all of it can be tested.
 */

/** The stretch of the sound in view, in seconds. */
export interface View {
  start: number;
  end: number;
}

/** The least that can fill the view: about a hundred samples. */
export const MIN_SPAN = 0.002;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** The whole sound. */
export function wholeView(duration: number): View {
  return { start: 0, end: Math.max(duration, MIN_SPAN) };
}

/** A view made to lie inside the sound and to be no shorter than MIN_SPAN. Its length is kept if it can be. */
export function fitView(view: View, duration: number): View {
  const length = Math.max(duration, MIN_SPAN);
  const span = clamp(view.end - view.start, Math.min(MIN_SPAN, length), length);
  const start = clamp(view.start, 0, length - span);
  return { start, end: start + span };
}

export function timeToX(view: View, width: number, time: number): number {
  return ((time - view.start) / (view.end - view.start)) * width;
}

export function xToTime(view: View, width: number, x: number): number {
  return view.start + (x / (width || 1)) * (view.end - view.start);
}

/** How much of the sound is in view: 1 is all of it, 4 a quarter. */
export function zoomOf(view: View, duration: number): number {
  return Math.max(duration, MIN_SPAN) / (view.end - view.start);
}

/**
 * Zooms by a factor (above 1 is closer) keeping one moment of the sound where it is on screen: the
 * moment under the pointer, or between two fingers.
 */
export function zoomAround(
  view: View,
  duration: number,
  factor: number,
  anchor: number,
): View {
  const length = Math.max(duration, MIN_SPAN);
  const span = clamp(
    (view.end - view.start) / (factor > 0 ? factor : 1),
    Math.min(MIN_SPAN, length),
    length,
  );
  const share = (anchor - view.start) / (view.end - view.start);
  return fitView(
    { start: anchor - share * span, end: anchor - share * span + span },
    duration,
  );
}

/** Scrolls by a number of seconds (later is positive). */
export function panBy(view: View, duration: number, seconds: number): View {
  return fitView(
    { start: view.start + seconds, end: view.end + seconds },
    duration,
  );
}

/** A view of a stretch with a little room either side of it. */
export function viewOf(
  from: number,
  to: number,
  duration: number,
  margin = 0.08,
): View {
  const low = Math.min(from, to);
  const high = Math.max(from, to);
  const pad = Math.max((high - low) * margin, MIN_SPAN / 2);
  const start = Math.max(0, low - pad);
  const end = Math.min(Math.max(duration, MIN_SPAN), high + pad);
  return fitView({ start, end: Math.max(end, start + MIN_SPAN) }, duration);
}

/**
 * What two fingers ask for: the view in which the two moments that were under them when they went down
 * are under them now. Spreading zooms, moving both scrolls, and both at once do both.
 */
export function pinchView(
  held: { view: View; x1: number; x2: number },
  now: { x1: number; x2: number },
  width: number,
  duration: number,
): View {
  const t1 = xToTime(held.view, width, held.x1);
  const t2 = xToTime(held.view, width, held.x2);
  const apart = Math.abs(now.x2 - now.x1);
  const length = Math.max(duration, MIN_SPAN);
  if (apart < 8 || Math.abs(t2 - t1) < 1e-9) {
    // fingers together: no telling a zoom, so only scroll by their middle
    const middle = (now.x1 + now.x2) / 2;
    const span = held.view.end - held.view.start;
    const start = (t1 + t2) / 2 - (middle / (width || 1)) * span;
    return fitView({ start, end: start + span }, duration);
  }
  const perPixel = Math.abs(t2 - t1) / apart;
  const span = clamp(perPixel * width, Math.min(MIN_SPAN, length), length);
  const start =
    Math.min(t1, t2) - (Math.min(now.x1, now.x2) / (width || 1)) * span;
  return fitView({ start, end: start + span }, duration);
}

// --- the ruler ---------------------------------------------------------------------------------------

export type RulerUnit = 'seconds' | 'ms' | 'steps' | 'percent';

export interface Tick {
  time: number;
  /** the label, for the ticks that have one */
  label: string | null;
}

const NICE = [1, 2, 5];

/** A round step no smaller than `least`: 1, 2 or 5 times a power of ten. */
function niceStep(least: number): number {
  const power = Math.pow(10, Math.floor(Math.log10(least)));
  for (const m of NICE) if (m * power >= least) return m * power;
  return 10 * power;
}

function short(value: number): string {
  return String(Number(value.toPrecision(6)));
}

/**
 * The ruler's ticks for a view: round numbers of the unit, about one label every `labelEvery` pixels.
 * @param one how long one of the unit is in seconds (a step at this tempo, a percent of the sound)
 */
export function rulerTicks(
  view: View,
  width: number,
  unit: RulerUnit,
  one = 1,
  labelEvery = 72,
): Tick[] {
  if (!(width > 0) || !(view.end > view.start)) return [];
  const scale =
    unit === 'ms' ? 0.001 : unit === 'seconds' ? 1 : one > 0 ? one : 1;
  const suffix =
    unit === 'ms'
      ? ' ms'
      : unit === 'seconds'
        ? ' s'
        : unit === 'percent'
          ? '%'
          : '';
  const perLabel = ((view.end - view.start) / width) * labelEvery; // seconds
  let step = niceStep(perLabel / scale); // in the unit
  // steps are counted in quarters, halves and wholes rather than tenths
  if (unit === 'steps') {
    const least = perLabel / scale;
    step =
      least <= 0.25 ? 0.25 : least <= 0.5 ? 0.5 : Math.max(1, niceStep(least));
  }
  const minor =
    unit === 'steps' && step <= 1
      ? step
      : step / (String(step)[0] === '2' ? 4 : 5);
  const ticks: Tick[] = [];
  const first = Math.ceil(view.start / (minor * scale) - 1e-9);
  const last = Math.floor(view.end / (minor * scale) + 1e-9);
  if (last - first > 2000) return [];
  for (let n = first; n <= last; n++) {
    const amount = n * minor;
    const major = Math.abs(amount / step - Math.round(amount / step)) < 1e-6;
    ticks.push({
      time: amount * scale,
      label: major ? `${short(amount)}${suffix}` : null,
    });
  }
  return ticks;
}

// --- handles -----------------------------------------------------------------------------------------

export type HandleId = 'start' | 'end' | 'loopStart' | 'loopEnd';

export const HANDLES: readonly HandleId[] = [
  'start',
  'end',
  'loopStart',
  'loopEnd',
];

/**
 * Where each handle's grab tab is, so that no two can cover each other however close their points are:
 * the region's handles hang from the top and the loop's stand on the bottom, and of each pair the first
 * has its tab to the right of its line and the second to the left. Start and end at the same moment
 * are then back to back, one tab each side of the line; start and loop start at the same moment are one
 * above the other.
 */
export const HANDLE_PLACE: Readonly<
  Record<HandleId, { lane: 'top' | 'bottom'; side: 1 | -1 }>
> = {
  start: { lane: 'top', side: 1 },
  end: { lane: 'top', side: -1 },
  loopStart: { lane: 'bottom', side: 1 },
  loopEnd: { lane: 'bottom', side: -1 },
};

export interface Tab {
  /** the size of a grab tab in px: at least 44 on touch screens */
  width: number;
  height: number;
}

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** The area the handles and the sound are drawn in: below the ruler. */
export interface Stage {
  width: number;
  /** the top of the body (the ruler's height) and its bottom */
  top: number;
  bottom: number;
}

/** A handle's grab tab on the stage. It is kept inside the stage at the edges. */
export function tabBox(id: HandleId, x: number, stage: Stage, tab: Tab): Box {
  const place = HANDLE_PLACE[id];
  const left = clamp(
    place.side === 1 ? x : x - tab.width,
    0,
    Math.max(0, stage.width - tab.width),
  );
  return {
    left,
    top: place.lane === 'top' ? stage.top : stage.bottom - tab.height,
    width: tab.width,
    height: tab.height,
  };
}

/**
 * The handle a pointer is on, or null. Tabs of a pair only overlap when their points are less than a
 * tab apart (and never when they are together); in the overlap the handle whose line is nearer wins,
 * and exactly between two the earlier one.
 */
export function hitHandle(
  times: Readonly<Partial<Record<HandleId, number>>>,
  view: View,
  stage: Stage,
  tab: Tab,
  x: number,
  y: number,
): HandleId | null {
  let best: HandleId | null = null;
  let distance = Infinity;
  for (const id of HANDLES) {
    const time = times[id];
    if (time === undefined) continue;
    const at = timeToX(view, stage.width, time);
    if (at < -1 || at > stage.width + 1) continue; // scrolled out of view: nothing to grab
    const box = tabBox(id, at, stage, tab);
    if (
      x < box.left ||
      x > box.left + box.width ||
      y < box.top ||
      y > box.top + box.height
    )
      continue;
    const away = Math.abs(x - at);
    if (away < distance) {
      best = id;
      distance = away;
    }
  }
  return best;
}

/** The slice boundary a pointer in the ruler is on (not the first or last, which are the sound's ends), or -1. */
export function hitMarker(
  slices: readonly number[],
  view: View,
  width: number,
  x: number,
  reach: number,
): number {
  let best = -1;
  let distance = reach;
  for (let index = 1; index < slices.length - 1; index++) {
    const away = Math.abs(timeToX(view, width, slices[index]!) - x);
    if (away <= distance) {
      best = index;
      distance = away;
    }
  }
  return best;
}

// --- snapping ----------------------------------------------------------------------------------------

export type Snap = 'off' | 'slices' | 'zero';

/** The nearest of some times within reach, or the time itself. */
export function snapTo(
  time: number,
  candidates: readonly number[],
  reach: number,
): number {
  let best = time;
  let distance = reach;
  for (const candidate of candidates) {
    const away = Math.abs(candidate - time);
    if (away <= distance) {
      best = candidate;
      distance = away;
    }
  }
  return best;
}

/**
 * The nearest moment the signal crosses zero, within `reach` seconds either side: a region that starts
 * and ends on one does not click. The time itself when there is none in reach.
 */
export function nearestZeroCrossing(
  samples: Float32Array,
  sampleRate: number,
  time: number,
  reach = 0.005,
): number {
  const centre = Math.round(time * sampleRate);
  const span = Math.max(1, Math.round(reach * sampleRate));
  const crosses = (index: number): boolean => {
    if (index < 1 || index >= samples.length) return false;
    const before = samples[index - 1]!;
    const after = samples[index]!;
    return (
      after === 0 || (before < 0 && after > 0) || (before > 0 && after < 0)
    );
  };
  for (let away = 0; away <= span; away++) {
    if (crosses(centre + away)) return (centre + away) / sampleRate;
    if (away > 0 && crosses(centre - away)) return (centre - away) / sampleRate;
  }
  return time;
}
