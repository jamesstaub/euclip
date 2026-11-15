/**
 * Ranges that come from live data.
 *
 * A parameter's metadata gives a static range: a sampler's `start` runs from 0 to 60 seconds whatever
 * it plays. What a control should offer is often narrower and only known while the project runs: the
 * length of the sample the sampler has. A binding to a parameter may therefore be given a live range,
 * worked out here from the node and the engine, and the host (audio/runner.ts) lays it over the static
 * one every time it describes the control. Nothing in the components knows where it came from, and a
 * compound widget (the waveform editor) reads the same thing.
 *
 * cracked-up's metadata does not say that a `seconds` parameter is a place in a buffer, so which
 * parameters have a live range is listed here by node type and parameter name.
 */
import type { Engine, Node } from 'cracked-up';

export interface LiveRange {
  /** narrower ends than the parameter's own */
  min?: number;
  max?: number;
  /** limits inside the range the value is held to, without changing the control's travel */
  floor?: number;
  ceiling?: number;
  /** the parameter is a place in a sample this long (seconds), with these slice boundaries */
  duration?: number;
  slices?: readonly number[];
  edge?: 'start' | 'end';
  /** where the control should stand for a raw value (a sampler's end of 0 means the end of the sample) */
  shown?(value: number): number;
  /** the live data is not there yet: why, in words. The static range is used meanwhile. */
  waiting?: string;
}

export interface LiveContext {
  engine: Engine;
  node: Node;
}

type Source = (context: LiveContext) => LiveRange | null;

/** The least a sampler's region may be: start and end never meet (at or before start, end means "to the end"). */
export const REGION_GAP = 0.001;

type Place = 'start' | 'end' | 'loopStart' | 'loopEnd';

/** A sampler's region and loop as it plays them, from the raw parameter values and the sound's length. */
export function samplerRegion(
  raw: Readonly<Record<Place, number>>,
  length: number,
): Record<Place, number> {
  const start = Math.min(Math.max(raw.start || 0, 0), length);
  const end = raw.end > start ? Math.min(raw.end, length) : length;
  // a loop end at or before the loop start (the defaults, 0 and 0) means the whole region goes round
  const whole = !(raw.loopEnd > raw.loopStart);
  const loopStart = whole
    ? start
    : Math.min(Math.max(raw.loopStart, start), end);
  const loopEnd = whole ? end : Math.min(Math.max(raw.loopEnd, loopStart), end);
  return { start, end, loopStart, loopEnd };
}

/**
 * One of a sampler's four places in its sound: within the sound it plays (`node.buffer`), on the right
 * side of the others (start before end; the loop points inside the region, in order), and standing
 * where the sampler will really play from when the raw value means "the default" (an end of 0 is the
 * end of the sound; loop points of 0 and 0 are the whole region).
 */
function samplerPlace(place: Place): Source {
  return ({ node }) => {
    const ref = node.buffer;
    if (!ref) return null; // a sampler with nothing to play
    if (ref.state === 'error') {
      return { waiting: `The sample "${ref.key}" did not load` };
    }
    if (ref.state === 'loading' || ref.duration === null) {
      return { waiting: `Waiting for the sample "${ref.key}" to load` };
    }
    const length = ref.duration;
    const raw = (): Record<Place, number> => ({
      start: Number(node.param('start').value) || 0,
      end: Number(node.param('end').value) || 0,
      loopStart:
        'loopStart' in node.params
          ? Number(node.param('loopStart').value) || 0
          : 0,
      loopEnd:
        'loopEnd' in node.params ? Number(node.param('loopEnd').value) || 0 : 0,
    });
    const now = samplerRegion(raw(), length);
    const shared = {
      min: 0,
      max: length,
      duration: length,
      slices: ref.slices,
      edge:
        place === 'start' || place === 'loopStart'
          ? ('start' as const)
          : ('end' as const),
      // where the control stands for a raw value: the others as they are now, this one as given
      shown: (value: number): number =>
        samplerRegion({ ...raw(), [place]: value }, length)[place],
    };
    switch (place) {
      case 'start':
        return { ...shared, ceiling: Math.max(0, now.end - REGION_GAP) };
      case 'end':
        return { ...shared, floor: Math.min(length, now.start + REGION_GAP) };
      case 'loopStart':
        return {
          ...shared,
          floor: now.start,
          ceiling: Math.max(now.start, now.loopEnd - REGION_GAP),
        };
      case 'loopEnd':
        return {
          ...shared,
          floor: Math.min(now.end, now.loopStart + REGION_GAP),
          ceiling: now.end,
        };
    }
  };
}

const SOURCES: Readonly<Record<string, Readonly<Record<string, Source>>>> = {
  sampler: {
    start: samplerPlace('start'),
    end: samplerPlace('end'),
    loopStart: samplerPlace('loopStart'),
    loopEnd: samplerPlace('loopEnd'),
  },
};

/** The live range of one parameter of a node, or null when it has none. */
export function liveRange(
  context: LiveContext,
  param: string,
): LiveRange | null {
  return SOURCES[context.node.type]?.[param]?.(context) ?? null;
}
