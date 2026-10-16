// Step patterns for the non-euclidean sequencer kinds. Each returns an array of 0s and 1s.

export const MAX_PATTERN_STEPS = 64;
export const MAX_BINARY_VALUE = 127;

// the binary digits of a number, most significant first, with no leading zeros: 5 -> 101, 0 -> 0
export function binaryPattern(value) {
  const n = Math.min(
    MAX_BINARY_VALUE,
    Math.max(0, Math.floor(Number(value) || 0))
  );
  return n.toString(2).split('').map(Number);
}

// `on` hits then `off` rests, `times` times over: (3, 2, 2) -> 1 1 1 0 0 1 1 1 0 0
export function onOffPattern(on, off, times) {
  const count = (n) => Math.max(0, Math.floor(Number(n) || 0));
  const cycle = [...Array(count(on)).fill(1), ...Array(count(off)).fill(0)];
  const pattern = [];
  for (let i = 0; i < count(times) && cycle.length; i++) pattern.push(...cycle);
  return pattern.slice(0, MAX_PATTERN_STEPS);
}
