import { resolveSpec } from './macros/schema';

// Deep merge
function dm(obj1, obj2) {
  let result = { ...obj1 };

  for (const key in obj2) {
    if (obj2.hasOwnProperty(key)) {
      if (
        typeof obj2[key] === 'object' &&
        obj2[key] !== null &&
        !Array.isArray(obj2[key])
      ) {
        if (
          obj1.hasOwnProperty(key) &&
          typeof obj1[key] === 'object' &&
          obj1[key] !== null &&
          !Array.isArray(obj1[key])
        ) {
          // If both properties are objects, recursively merge them
          result[key] = dm(obj1[key], obj2[key]);
        } else {
          // If the property doesn't exist in the first object, or it's not an object, shallow copy it
          result[key] = { ...obj2[key] };
        }
      } else {
        // If the property is not an object, or it's an array, shallow copy it
        result[key] = obj2[key];
      }
    }
  }

  return result;
}

const DB = 'dB';
const RATE = 'Play Rate';
const HZ = 'Hz';
const CENTS = 'Cents';
const HALFSTEPS = 'Half Steps';
const Q = 'Q';
const S = 'Seconds';
const MS = 'Miliseconds';
const AMP = 'Amplitude';
const CURVE = 'Curve';
const BOOL = 'Boolean';
const PRCNT = '% Sample';
const LOOPSYNC = 'Loop Sync';
const LOOPSTEPS = 'Loop Steps';
const RATIO = 'Ratio';
const PAN = 'Pan';
const PATH = 'Path';
const SLICE = 'Slice';
/* Bool */
const boolean = { [BOOL]: {} };

/* Seconds */

const seconds = {
  [S]: {
    func: (s) => s,
    min: 0,
    max: 2,
    stepSize: 0.25,
    defaultValue: 0,
  },
  [MS]: {
    func: (ms) => ms / 1000,
    min: 0,
    max: 2000,
    stepSize: 5,
    defaultValue: 0,
  },
  [LOOPSTEPS]: {
    func: (b, { intervalMs }) => (b * intervalMs) / 1000,
    min: 0,
    max: 2, // TODO dynamically set from sequence length
    stepSize: 0.25,
    defaultValue: 0,
  },
};

const delaySeconds = dm(seconds, {
  [S]: {
    defaultValue: 0.25,
  },
  [MS]: {
    min: 10,
    max: 1000,
    defaultValue: 250,
  },
  [LOOPSTEPS]: {
    defaultValue: 0.25,
  },
});

/* Amplitude */
const amplitude = {
  [AMP]: {
    func: (a) => a,
    min: 0,
    max: 1,
    stepSize: 0.01,
    defaultValue: 1,
  },
  [DB]: {
    func: (db) => Math.pow(10, db / 20),
    min: -60,
    max: 6,
    stepSize: 1,
    defaultValue: 0,
  },
};

const pan = {
  [PAN]: {
    func: (pan) => pan,
    min: -1,
    max: 1,
    stepSize: 0.01,
    defaultValue: 0,
  },
};

const ratio = {
  [RATIO]: {
    func: (r) => r,
    min: 1,
    max: 20,
    stepSize: 0.5,
    defaultValue: 4,
  },
};

const curve = {
  [CURVE]: {
    func: (c) => c,
    min: 0,
    max: 4,
    stepSize: 0.1,
    defaultValue: 1,
  },
};

const decibels = {
  [DB]: {
    func: (a) => a,
    min: -100,
    max: 0,
    stepSize: 1,
    defaultValue: -6,
  },
};

const damping = dm(amplitude, {
  [AMP]: {
    defaultValue: 0.84,
  },
});

// short envelope times, e.g. compressor attack/release
const compAttack = dm(seconds, {
  [S]: { max: 1, stepSize: 0.001, defaultValue: 0.003 },
  [MS]: { max: 1000, stepSize: 1, defaultValue: 3 },
  [LOOPSTEPS]: { max: 1, stepSize: 0.05, defaultValue: 0 },
});

const compRelease = dm(seconds, {
  [S]: { max: 1, stepSize: 0.01, defaultValue: 0.25 },
  [MS]: { max: 1000, stepSize: 5, defaultValue: 250 },
  [LOOPSTEPS]: { max: 2, stepSize: 0.05, defaultValue: 0.25 },
});

const reverbDecay = dm(seconds, {
  [S]: { min: 0.1, max: 10, stepSize: 0.1, defaultValue: 2 },
  [MS]: { min: 100, max: 10000, stepSize: 100, defaultValue: 2000 },
  [LOOPSTEPS]: { min: 0.1, max: 8, stepSize: 0.25, defaultValue: 2 },
});

const knee = {
  [DB]: {
    func: (a) => a,
    min: 0,
    max: 40,
    stepSize: 1,
    defaultValue: 30,
  },
};

/* Speed / PlaybackRate */

const speed = {
  [RATE]: {
    func: (rate) => rate,
    min: 0,
    max: 2,
    stepSize: 0.0125,
    defaultValue: 1,
  },
  [HALFSTEPS]: {
    func: (steps) => Math.pow(2, steps / 12),
    min: -12,
    max: 12,
    stepSize: 1,
    defaultValue: 0,
  },
  [CENTS]: {
    func: (cents) => Math.pow(2, cents / 1200),
    min: -1200,
    max: 1200,
    stepSize: 10,
    defaultValue: 0,
  },
  [LOOPSYNC]: {
    func: (input, { intervalMs, sampleLenSec, seqSteps }) => {
      if (!sampleLenSec) {
        console.warn(
          'Warning: attempted to set loop-relative playback rate but no sample length provided'
        );
        return 1;
      }
      const sequenceDuration = (intervalMs / 1000) * seqSteps;

      // Inverse proportional calculation
      const playbackRate = (sampleLenSec / sequenceDuration) * input;

      return playbackRate;
    },

    min: 0.5,
    max: 2, // TODO dynamically set from sequence length
    stepSize: 0.5,
    defaultValue: 1,
  },
};

/* Frequency */

const frequency = {
  [HZ]: {
    func: (hz) => hz,
  },
  // TODO implement logarithmic hz
  [HALFSTEPS]: {
    func: (steps) => cracked.pitch2freq(steps),
  },
  [CENTS]: {
    func: (cents) => cracked.pitch2freq(cents / 100),
  },
};

const oscillatorFrequency = dm(frequency, {
  [HZ]: {
    scale: 'log',
    min: 20,
    max: 20000,
    stepSize: 1,
    defaultValue: 440,
  },
  [HALFSTEPS]: {
    min: 0,
    max: 127,
    stepSize: 1,
    defaultValue: 10,
  },
  [CENTS]: {
    min: 0,
    max: 12700,
    stepSize: 10,
    defaultValue: 2400,
  },
});

const filterFrequency = dm(frequency, {
  [HZ]: {
    scale: 'log',
    min: 20,
    max: 20000,
    stepSize: 1,
    defaultValue: 440,
  },
  [HALFSTEPS]: {
    min: 0,
    max: 127,
    stepSize: 1,
    defaultValue: 36,
  },
  [CENTS]: {
    min: 0,
    max: 12700,
    stepSize: 10,
    defaultValue: 2400,
  },
});

const delayFeedback = dm(amplitude, {
  [AMP]: {
    max: 0.95, // 1 would never decay
    defaultValue: 0.5,
  },
  [DB]: {
    max: 0,
    defaultValue: -6,
  },
});

// drive/distortion amounts: 0 is clean
const drive = dm(amplitude, {
  [AMP]: { defaultValue: 0.5 },
  [DB]: { min: -60, max: 6, defaultValue: -6 },
});

const q = {
  [Q]: {
    func: (q) => q,
    min: 0.1,
    max: 20,
    stepSize: 0.1,
    defaultValue: 1,
  },
};

// Where each kind of filter starts: a low-pass wide open and a high-pass fully closed (so a new filter
// doesn't change the sound until the user moves it), the others somewhere audible.
const filterAt = (hz) => dm(filterFrequency, { [HZ]: { defaultValue: hz } });

// low-pass/high-pass Q is in dB (0 is flat); the other filters' Q is a plain ratio
const flatQ = dm(q, { [Q]: { min: 0, defaultValue: 0 } });

const lfoFrequency = dm(frequency, {
  [HZ]: {
    min: 0.01,
    max: 20,
    stepSize: 0.01,
    defaultValue: 1,
  },
  // TODO replace halfsteps with LOOPSTEPS for LFO
  [HALFSTEPS]: {
    min: 0,
    max: 24,
    stepSize: 1,
    defaultValue: 10,
  },
  [CENTS]: {
    min: 0,
    max: 100,
    stepSize: 10,
    defaultValue: 10,
  },
});

// ring modulator carriers are audio-rate, unlike LFOs
const ringFrequency = dm(oscillatorFrequency, {
  [HZ]: { scale: 'log', min: 1, max: 5000, stepSize: 1, defaultValue: 30 },
});

// LFO depth is a multiplier on the modulated param
const lfoDepth = dm(amplitude, {
  [AMP]: { min: 0, max: 1000, stepSize: 0.1, defaultValue: 1 },
});

// `edge` is 'start' or 'end': the Slice unit reads them differently (see below)
const sampleStartEnd = (defaultPct, edge) => ({
  [PRCNT]: {
    func: (pct, { sampleLenSec }) => (pct / 100) * (sampleLenSec || 0),
    min: 0,
    max: 100,
    stepSize: 1,
    defaultValue: defaultPct,
  },
  // An onset slice of the sample, by index (the slices are where the sample's onsets cut it; see TrackNode#sliceBoundaries).
  // `start` is the first slice that plays and `end` the last one (inclusive), so a single slice is start === end.
  // Until the sample has been analysed it is one slice: the whole file. The range is fitted to the real number of
  // slices once they are known (TrackNode#syncSliceRanges).
  [SLICE]: {
    func: (index, { sliceBoundaries = [], sampleLenSec = 0 }) => {
      const count = sliceBoundaries.length - 1;
      if (count < 1) return edge === 'end' ? sampleLenSec : 0;
      const slice = Math.min(Math.max(Math.round(index), 0), count - 1);
      return edge === 'end' ? sliceBoundaries[slice + 1] : sliceBoundaries[slice];
    },
    min: 0,
    max: 63,
    stepSize: 1,
    defaultValue: edge === 'end' ? 63 : 0,
  },
});

/* Time */
// percent of current sample length to seconds

const channels = {
  label: 'Channels',
  func: (channels) => channels,
};

const length = {
  label: 'Length',
  func: (length) => length,
};

// This just ensures the order of unit dropdown menu where the first item is the default
export const unitOptionsForNode = {
  attack: [S, MS, LOOPSTEPS],
  release: [S, MS, LOOPSTEPS],
  gain: [AMP, DB],
  speed: [RATE, HALFSTEPS, CENTS, LOOPSYNC],
  frequency: [HZ, HALFSTEPS, CENTS],
  detune: [CENTS],
  q: [Q],
  decay: [S, MS, LOOPSTEPS],
  sustain: [AMP],
  delay: [S, MS, LOOPSTEPS],
  damping: [AMP],
  feedback: [AMP],
  cutoff: [HZ, HALFSTEPS, CENTS],
  drive: [AMP],
  color: [HZ, HALFSTEPS, CENTS],
  postCut: [HZ, HALFSTEPS, CENTS],
  distortion: [CURVE],
  knee: [DB],
  start: [S, MS, LOOPSTEPS, PRCNT, SLICE],
  threshold: [DB],
  ratio: [RATIO],
  end: [S, MS, LOOPSTEPS, PRCNT, SLICE],
  reverse: [BOOL],
  loop: [BOOL],
  path: [PATH],
  pan: [PAN],
  snap: [BOOL],
};

// each of these node params should have a merge object with specific min/max/step/default values
export const defaultNodeParamsByUnit = {
  adsr: {
    attack: seconds,
    decay: seconds,
    sustain: amplitude,
    release: seconds,
  },
  allpass: {
    frequency: filterAt(1000),
    q: q,
  },
  bandpass: {
    frequency: filterAt(1000),
    q: q,
  },
  bitcrusher: {},
  channelStrip: {
    gain: dm(amplitude, { [AMP]: { defaultValue: 0.9 } }),
    pan: pan,
  },
  comb: { frequency: filterFrequency },
  compressor: {
    threshold: decibels,
    knee: knee,
    ratio: ratio,
    attack: compAttack,
    release: compRelease,
  },
  delay: {
    delay: delaySeconds,
    damping: damping,
    feedback: delayFeedback,
    cutoff: filterFrequency,
  },
  gain: {
    gain: amplitude,
  },
  highpass: { frequency: filterAt(20), q: flatQ },
  highshelf: { frequency: filterAt(4000) },
  lfo: {
    frequency: lfoFrequency,
    gain: lfoDepth,
  },
  lowshelf: {
    frequency: filterAt(200),
    q: q,
  },
  lowpass: {
    frequency: filterAt(20000),
    q: flatQ,
  },
  notch: {
    frequency: filterAt(1000),
    q: q,
  },
  overdrive: {
    drive: drive,
    color: filterFrequency,
    postCut: filterFrequency,
  },
  panner: {
    pan: pan,
  },
  peaking: {
    frequency: filterAt(1000),
    q: q,
  },
  reverb: {
    decay: reverbDecay,
    reverse: boolean,
  },
  ring: {
    distortion: curve,
    frequency: ringFrequency,
  },
  sampler: {
    speed: speed,
    start: dm(seconds, sampleStartEnd(0, 'start')),
    end: dm(seconds, sampleStartEnd(100, 'end')),
    loop: boolean,
    snap: boolean,
    path: {},
  },
  sine: {
    frequency: oscillatorFrequency,
  },
  square: {
    frequency: oscillatorFrequency,
  },
  sawtooth: {
    frequency: oscillatorFrequency,
  },
  saw: {
    frequency: oscillatorFrequency,
  },
  triangle: {
    frequency: oscillatorFrequency,
  },
  waveshaper: {
    drive: drive,
  },
  noise: {
    channels: channels,
    length: length,
  },
  pink: {
    channels: channels,
    length: length,
  },
  white: {
    channels: channels,
    length: length,
  },
  brown: {
    channels: channels,
    length: length,
  },
};

/**
 * Unit labels available for a given node type + attr, in menu order.
 * Filtered to the units the node type actually configures, so e.g. an
 * attr shared by many nodes only offers what makes sense for this one.
 */
export function unitOptionsFor(nodeType, nodeAttr) {
  const ordered = unitOptionsForNode[nodeAttr] ?? [];
  const configured = defaultNodeParamsByUnit[nodeType]?.[nodeAttr];
  if (!configured) return ordered;
  const available = ordered.filter((unit) => unit in configured);
  return available.length ? available : ordered;
}

/**
 * The unit table for one macro setting, in the same shape as the audio nodes' (see defaultNodeParamsByUnit):
 * macros describe their own controls in a schema (utils/macros), so this is built from a setting's spec on
 * demand, not stored, and follows the script when it changes.
 */
export function macroUnitParams(spec) {
  const { unit, min, max, stepSize, defaultValue } = resolveSpec(spec);
  return {
    [unit]: {
      // a choice is stored as an index and reaches the macro as the chosen string
      func: spec.type === 'choice' ? (i) => spec.choices[Math.round(i)] : (value) => value,
      min,
      max,
      stepSize,
      defaultValue,
      scale: spec.scale,
    },
  };
}
