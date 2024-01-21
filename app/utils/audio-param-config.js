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
/* Bool */
const boolean = { [BOOL]: {} };

/* Seconds */
const sToS = {
  label: S,
};
const msToS = {
  label: MS,
  func: (ms) => ms / 1000,
};
const loopstepsToS = {
  label: LOOPSTEPS,
  func: (b, { intervalMs }) => (b * intervalMs) / 1000,
};

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
    max: 4, // TODO dynamically set from sequence length
    stepSize: 1,
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
const aToa = {
  label: AMP,
};

const dbToa = {
  label: DB,
  func: (db) => Math.pow(10, db / 20),
};

const amplitude = {
  [AMP]: {
    func: (a) => a,
  },
  [DB]: {
    func: (db) => Math.pow(10, db / 20),
  },
};

const pan = {
  [PAN]: {
    func: (pan) => pan,
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
    defailtValue: 0.84,
  },
});

/* Speed / PlaybackRate */
const rateToRate = {
  label: RATE,
};

const halfstepsToRate = {
  label: HALFSTEPS,
  func: (steps) => Math.pow(2, steps / 12),
};

const centToRate = {
  label: CENTS,
  func: (cents) => Math.pow(2, cents / 1200),
};

const loopstepsToRate = {
  label: LOOPSTEPS,
  func: (b, { intervalMs }) => Math.pow(2, (b * intervalMs) / 1200),
};

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
    // the loopsteps function fro rate should look at the intervalMs and the sampleLenSec which is the milliseconds per beat of the loop.
    // when the input is 1, the loop should last 1 beat, when the input is 2 the loop should last 2 beats (ie. it should be slower, lower rate)
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
const hzToHz = {
  label: HZ,
};

const halfstepsToHz = {
  label: HALFSTEPS,
  func: (steps) => cracked.pitch2freq(steps),
};

const centToHz = {
  label: CENTS,
  func: (cents) => cracked.pitch2freq(cents / 100),
};

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
    defaultValue: 0.5,
  },
});


const q = {
  [Q]: {
    func: (q) => q,
    min: 0,
    max: 20,
    stepSize: 1,
    defaultValue: 0,
  },
};

const lfoFrequency = dm(frequency, {
  [HZ]: {
    min: 0,
    max: 20,
    stepSize: 0.1,
    defaultValue: 1,
  },
  [HALFSTEPS]: {
    min: 0,
    max: 127,
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

/* Time */
// percent of current sample length to seconds
const pctToS = {
  label: PRCNT,
  func: (pct, { sampleLenSec }) => pct * sampleLenSec,
};

const loopStepToS = {
  label: LOOPSTEPS,
  func: (b, { intervalMs }) => (b * intervalMs) / 1000,
};

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
  start: [S, MS, LOOPSTEPS, PRCNT],
  threshold: [DB],
  ratio: [RATIO],
  end: [S, MS, LOOPSTEPS, PRCNT],
  reverse: [BOOL],
  loop: [BOOL],
  path: [PATH],
  pan: [PAN],
};

// TODO finish this datastructure and phase out the above unitTransformsForNodeAttr
// use defaultNodeParamsByUnit for track-control creation as well as assignments
// when toggling unit type.

// each of these node params should have a merge object with specific min/max/step/default values
export const defaultNodeParamsByUnit = {
  adsr: {
    attack: seconds,
    decay: seconds,
    sustain: amplitude,
    release: seconds,
  },
  allpasss: {
    frequency: filterFrequency,
    q: q,
  },
  bandpass: {
    frequency: filterFrequency,
    q: q,
  },
  bitcrusher: {},
  channelStrip: {
    gain: amplitude,
    pan: pan,
  },
  comb: { frequency: filterFrequency },
  compressor: {
    threshold: decibels,
    knee: amplitude,
    ratio: amplitude,
    attack: seconds,
    release: seconds,
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
  highpass: { frequency: filterFrequency },
  highshelf: { frequency: filterFrequency },
  lfo: {
    frequency: lfoFrequency,
    gain: amplitude,
  },
  lowshelf: {
    frequency: filterFrequency,
    q: q,
  },
  lowpass: {
    frequency: filterFrequency,
    q: q,
  },
  notch: {
    frequency: filterFrequency,
    q: q,
  },
  overdrive: {
    drive: amplitude,
    color: filterFrequency,
    postCut: filterFrequency,
  },
  panner: {
    pan: amplitude,
  },
  peaking: {
    frequency: filterFrequency,
    q: q,
  },
  reverb: {
    decay: seconds,
    reverse: boolean,
  },
  ring: {
    distortion: amplitude,
    frequency: lfoFrequency,
  },
  sampler: {
    speed: speed,
    start: seconds,
    end: seconds,
    loop: boolean,
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
    drive: amplitude,
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
