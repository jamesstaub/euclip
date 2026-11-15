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
  /** the node's creation options as the scope's snapshot gives them (a buffer is its key in the store) */
  init: Readonly<Record<string, unknown>> | undefined;
}

type Source = (context: LiveContext) => LiveRange | null;

/** The least a sampler's region may be: start and end never meet (at or before start, end means "to the end"). */
export const REGION_GAP = 0.001;

/** A sampler's start or end: within the sample it plays, and on the right side of the other. */
function samplerRegion(edge: 'start' | 'end'): Source {
  return ({ engine, node, init }) => {
    const key = init?.['buffer'];
    if (typeof key !== 'string') return null; // a sampler with nothing to play
    const ref = engine.buffers.get(key);
    if (!ref || ref.state === 'loading' || ref.duration === null) {
      return { waiting: `Waiting for the sample "${key}" to load` };
    }
    if (ref.state === 'error') {
      return { waiting: `The sample "${key}" did not load` };
    }
    const length = ref.duration;
    const start = Math.min(Number(node.param('start').value) || 0, length);
    const rawEnd = Number(node.param('end').value) || 0;
    const end = rawEnd > start ? Math.min(rawEnd, length) : length;
    const shared = {
      min: 0,
      max: length,
      duration: length,
      slices: ref.slices,
      edge,
    };
    return edge === 'start'
      ? {
          ...shared,
          ceiling: Math.max(0, end - REGION_GAP),
          shown: (value) => Math.min(Math.max(value, 0), length),
        }
      : {
          ...shared,
          floor: Math.min(length, start + REGION_GAP),
          shown: (value) => (value > start ? Math.min(value, length) : length),
        };
  };
}

const SOURCES: Readonly<Record<string, Readonly<Record<string, Source>>>> = {
  sampler: { start: samplerRegion('start'), end: samplerRegion('end') },
};

/** The live range of one parameter of a node, or null when it has none. */
export function liveRange(
  context: LiveContext,
  param: string,
): LiveRange | null {
  return SOURCES[context.node.type]?.[param]?.(context) ?? null;
}
