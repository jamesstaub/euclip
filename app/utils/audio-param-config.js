const DB = 'dB';
const RATE = 'Play Rate';
const HZ = 'Hz';
const CENTS = 'Cents';
const STEPS = 'Steps';
const Q = 'Q';
const S = 'Seconds';
const MS = 'Miliseconds';
const AMP = 'Amplitude';
const CURVE = 'Curve';
const BOOL = 'Boolean';
const PRCNT  = '%';

export const unitTransformsForNodeAttr = {
  gain: [AMP, DB],
  speed: [RATE, STEPS, CENTS],
  frequency: [HZ, CENTS],
  detune: [CENTS],
  q: [Q],
  decay: [S, MS],
  delay: [S, MS],
  damping: [DB],
  feedback: [AMP],
  cutoff: [HZ],
  drive: [AMP],
  color: [HZ],
  postCut: [HZ],
  distortion: [CURVE],
  knee: [DB],
  start: [S, MS, PRCNT],
  threshold: [DB],
  end: [S, MS, PRCNT],
  reverse: [BOOL],
  loop: [BOOL],
};

const centToHz = (cents) => Math.pow(2, cents / 1200);
const dbToa = (db) => Math.pow(10, db / 20);
const StepsToRate = (steps) => Math.pow(2, steps / 12);
const CentsToRate = (cents) => centToHz(cents) / centToHz(0);