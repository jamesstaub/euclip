/**
 * Maps between a parameter's real value and a 0-1 position on its range. Widgets work in
 * normalized positions so the same slider, X-Y pad or piano can sweep a log-scaled frequency or
 * a linear gain without knowing which.
 */
export type ParamScale = 'linear' | 'log';

export interface ParamRange {
  min: number;
  max: number;
  scale?: ParamScale;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

// a log scale needs a positive floor
const logFloor = (min: number) => (min > 0 ? min : 1e-3);

export function toNormalized(value: number, { min, max, scale }: ParamRange): number {
  if (!(max > min)) return 0;
  if (scale === 'log') {
    const lo = logFloor(min);
    if (!(max > lo)) return 0;
    return clamp01(Math.log(Math.max(value, lo) / lo) / Math.log(max / lo));
  }
  return clamp01((value - min) / (max - min));
}

export function fromNormalized(norm: number, { min, max, scale }: ParamRange): number {
  const n = clamp01(norm);
  if (!(max > min)) return min;
  if (scale === 'log') {
    const lo = logFloor(min);
    return lo * Math.pow(max / lo, n);
  }
  return min + n * (max - min);
}

/** Snap to the nearest multiple of `step` (measured from `min`), without float noise. */
export function snapToStep(value: number, step: number, min = 0): number {
  if (!(step > 0)) return value;
  const snapped = min + Math.round((value - min) / step) * step;
  const places = Math.min(8, (String(step).split('.')[1] ?? '').length);
  return Number(snapped.toFixed(places));
}
