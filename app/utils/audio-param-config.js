const DB = 'dB';
const RATE = 'Play Rate';
const HZ = 'Hz';
const CENTS = 'Cents';
const HALFSTEPS = 'Half Steps';
const BEATS = 'Beats';
const Q = 'Q';
const S = 'Seconds';
const MS = 'Miliseconds';
const AMP = 'Amplitude';
const CURVE = 'Curve';
const BOOL = 'Boolean';
const PRCNT = '%';
const LOOPSTEPS = 'Steps';
const RATIO = 'Ratio';

export const unitTransformsForNodeAttr = {
  attack: [S, MS, BEATS],
  release: [S, MS, BEATS],
  gain: [AMP, DB],
  speed: [RATE, HALFSTEPS, CENTS, LOOPSTEPS],
  frequency: [HZ, CENTS],
  detune: [CENTS],
  q: [Q],
  decay: [S, MS, BEATS],
  delay: [S, MS, BEATS],
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
  ratio: [RATIO],
  end: [S, MS, PRCNT],
  reverse: [BOOL],
  loop: [BOOL],
};

const centToHz = (cents) => Math.pow(2, cents / 1200);
const dbToa = (db) => Math.pow(10, db / 20);
const StepsToRate = (steps) => Math.pow(2, steps / 12);
const CentsToRate = (cents) => centToHz(cents) / centToHz(0);

// When you select a unit from the dropdown it should set all the defaults for
// the trackcontrol. ther can be muultiple choiecs that are the same unit but
// different ranges, like Hz vs LFO Hz or Cents (chromatic) vs Cents (Diatonic)
