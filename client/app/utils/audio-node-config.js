export const FILTER = 'filter';
export const DISTORTION = 'distortion';
export const DYNAMICS = 'dynamics';
export const TIME = 'time';

// groups of interfaces for different params
export const bool = ['toggle'];
export const oneD = ['slider', 'dial', 'multislider'];
export const twoD = ['position']; // control 2 attributes
export const tonal = ['piano'];
export const array = ['envelope'];
export const filepath = ['filepath'];

// attr: min, max, defaultValue, interfaceOptions
const filterAttrs = {
  frequency: [20, 10000, 10000, oneD],
  q: [0, 20, 0, oneD],
};

const gainableFilterAttrs = {
  ...filterAttrs,
  gain: [0, 16, 0, oneD],
};

const envelopeAttrs = {
  attack: [0.003, 1, 0.0125, oneD],
  decay: [0, 4, 0, oneD],
  sustain: [0, 1, 0.15, oneD],
  release: [0, 1, 0.25, oneD],
};

const oscillatorAttrs = {
  frequency: [0, 20000, 440, oneD],
};

// TODO: abstract the values of defaultParams (below)
// and populate the min/max/defaultValue/defaultInterface of AudioNodeConfig
// and this should be the source of truth for all nodes + control configs
// note attrs array is [min, max, defaultValue, interfaceOptions]
export const AudioNodeConfig = {
  adsr: {
    type: DYNAMICS,
    attrs: {
      ...envelopeAttrs,
    },
  },
  allpasss: {
    type: FILTER,
    attrs: {
      ...filterAttrs,
    },
  },
  bandpass: {
    type: FILTER,
    attrs: {
      ...filterAttrs,
    },
  },
  bitcrusher: {
    type: DISTORTION,
    attrs: {
      frequency: [0, 1, 0.1, oneD],
      bits: [1, 16, 1, oneD],
    },
  },
  comb: {
    type: FILTER,
    attrs: {
      delay: [0, 6, 1, oneD],
      damping: [0, 1, 0.84, oneD],
      cutoff: [],
      feedback: [0, 1, 0.25, oneD],
    },
  },
  compressor: {
    type: DYNAMICS,
    attrs: {
      threshold: [-60, 0, -12, oneD],
      knee: [0, 40, 30, oneD],
      ratio: [1, 20, 12, oneD],
      attack: envelopeAttrs.attack,
      release: envelopeAttrs.release,
    },
  },
  channelStrip: {
    type: DYNAMICS,
    attrs: {
      gain: [0, 1, 1, oneD],
      pan: [-1, 1, 0, oneD],
    },
  },
  delay: {
    type: TIME,
    attrs: {
      delay: [0, 6, 1, oneD],
      damping: [0, 1, 0.84, oneD],
      feedback: [0, 1, 0.25, oneD],
      cutoff: [40, 10000, 10000, oneD],
    },
  },
  gain: {
    type: DYNAMICS,
    attrs: {
      gain: [0, 1, 1, oneD],
    },
  },
  highpass: {
    type: FILTER,
    attrs: {
      ...filterAttrs,
    },
  },
  lowpass: {
    type: FILTER,
    attrs: {
      ...filterAttrs,
    },
  },
  lowshelf: {
    type: FILTER,
    attrs: {
      ...gainableFilterAttrs,
    },
  },
  highshelf: {
    type: FILTER,
    attrs: {
      ...gainableFilterAttrs,
    },
  },
  peaking: {
    type: FILTER,
    attrs: {
      ...gainableFilterAttrs,
    },
  },
  notch: {
    type: FILTER,
    attrs: {
      ...filterAttrs,
    },
  },
  lfo: {
    attrs: {
      frequency: [0, 20, 5, oneD],
      gain: [0, 100, 10, oneD], // TODO: do we need LFO presets to be dynamic per their modulator?
    },
  },
  overdrive: {
    type: DISTORTION,
    attrs: {
      drive: [0, 2, 0.5, oneD],
      color: [0, 1000, 800, oneD],
      postCut: [0, 20000, 10000, oneD],
    },
  },
  panner: {
    type: DYNAMICS,
    attrs: {
      pan: [-1, 1, 0, oneD],
    },
  },
  reverb: {
    type: TIME,
    attrs: {
      reverse: [0, 1, 1, bool],
    },
    // seconds: [],
    // decay: [],
  },
  ring: {
    type: DISTORTION,
    attrs: {
      distortion: [0, 1, 0, oneD],
      frequency: [0, 20, 5, oneD],
    },
  },
  sampler: {
    attrs: {
      speed: [-2, 2, 1, oneD],
      start: [0, 1, 0, oneD],
      end: [0, 1, 1, oneD],
      loop: [0, 1, 1, bool],
      path: [null, null, null, filepath],
    },
  },
  sawtooth: {
    attrs: {
      ...oscillatorAttrs,
    },
  },
  saw: {
    attrs: {
      ...oscillatorAttrs,
    },
  },
  sine: {
    attrs: {
      ...oscillatorAttrs,
    },
  },
  square: {
    attrs: {
      ...oscillatorAttrs,
    },
  },
  triangle: {
    attrs: {
      ...oscillatorAttrs,
    },
  },
  waveshaper: {
    type: DISTORTION,
    attrs: {
      drive: [0, 100, 50, oneD],
    },
  },
  noise: {},
  pink: {},
  white: {},
  brown: {},
};

const oscillatorDefaults = {
  min: 0,
  max: 10000,
  stepSize: 10,
  defaultValue: 300,
  interfaceName: oneD,
  unit: 'hz',
};
const filterDefaults = {
  min: 0,
  max: 20000,
  stepSize: 10,
  defaultValue: 20000,
  interfaceName: oneD,
  unit: 'hz',
};

export const defaultParams = {
  attack: {
    min: 0.00125,
    max: 1,
    stepSize: 0.0125,
    defaultValue: 0,
    interfaceName: oneD,
    unit: 'seconds',
  },
  bits: {
    min: 1,
    max: 16,
    stepSize: 1,
    defaultValue: 6,
    interfaceName: oneD,
    unit: 'bits',
  },
  // channelStrip: {
  //   interfaceName: ['slider'],
  //   min: 0,
  //   max: 1,
  //   stepSize: 0.0125,
  //   defaultValue: 0.9,
  // },
  color: {
    min: 0,
    max: 1000,
    stepSize: 1,
    defaultValue: 800,
    interfaceName: oneD,
    unit: 'hz',
  },
  cutoff: {
    min: 0,
    max: 4000,
    stepSize: 20,
    defaultValue: 1500,
    interfaceName: oneD,
    unit: 'hz',
  },
  damping: {
    min: 0,
    max: 1,
    stepSize: 0.1,
    defaultValue: 0.84,
    interfaceName: oneD,
    unit: 'gain',
  },
  decay: {
    min: 0,
    max: 2,
    stepSize: 0.1,
    defaultValue: 0,
    interfaceName: oneD,
    unit: 'seconds',
  },
  delay: {
    min: 0,
    max: 1,
    stepSize: 0.1,
    defaultValue: 0.125,
    interfaceName: oneD,
    unit: 'seconds',
  },
  detune: {
    min: 0,
    max: 100,
    stepSize: 1,
    defaultValue: 0,
    interfaceName: oneD,
    unit: 'cents',
  },
  distortion: {
    min: 1,
    max: 4,
    stepSize: 0.1,
    defaultValue: 1,
    interfaceName: oneD,
    unit: 'curve amount',
  },
  drive: {
    min: 0,
    max: 2,
    stepSize: 0.1,
    defaultValue: 0.5,
    interfaceName: oneD,
    unit: 'curve amount',
  },
  end: {
    min: 0,
    max: 1,
    stepSize: 0.1,
    defaultValue: 1,
    interfaceName: oneD,
    unit: 'seconds',
  },
  feedback: {
    min: 0,
    max: 1,
    stepSize: 0.1,
    defaultValue: 0,
    interfaceName: oneD,
    unit: 'gain',
  },
  frequency: {
    sine: oscillatorDefaults,
    saw: oscillatorDefaults,
    sawtooth: oscillatorDefaults,
    square: oscillatorDefaults,
    triangle: oscillatorDefaults,
    bandpass: filterDefaults,
    lowpass: filterDefaults,
    highpass: filterDefaults,
    lowshelf: filterDefaults,
    highshelf: filterDefaults,
    peaking: filterDefaults,
    notch: filterDefaults,
    lfo: {
      min: 0,
      max: 20,
      stepSize: 0.0125,
      defaultValue: 5,
      interfaceName: oneD,
      unit: 'hz',
    },
  },
  gain: {
    min: 0,
    max: 1,
    stepSize: 0.0125,
    defaultValue: 0.9,
    interfaceName: oneD,
    unit: 'gain',
  },
  knee: {
    min: 0,
    max: 40,
    stepSize: 1,
    defaultValue: 30,
    interfaceName: oneD,
    unit: 'decibels',
  },
  loop: {
    min: false,
    max: true,
    defaultValue: false,
    interfaceName: bool,
  },
  pan: {
    min: -1,
    max: 1,
    stepSize: 0.01,
    defaultValue: 0,
    interfaceName: oneD,
    unit: 'gain',
  },
  postCut: {
    min: 0,
    max: 5000,
    stepSize: 10,
    defaultValue: 3000,
    interfaceName: oneD,
    unit: 'hz',
  },
  q: {
    min: 0,
    max: 20,
    stepSize: 0.5,
    defaultValue: 0,
    interfaceName: oneD,
  },
  ratio: {
    min: 1,
    max: 20,
    stepSize: 1,
    defaultValue: 12,
    interfaceName: oneD,
  },
  release: {
    min: 0.00125,
    max: 1,
    stepSize: 0.0125,
    defaultValue: 0,
    interfaceName: oneD,
    unit: 'seconds',
  },
  reverse: {
    min: 0,
    max: 1,
    defaultValue: 0,
    interfaceName: bool,
  },
  seconds: {
    min: 0,
    max: 1,
    stepSize: 0.1,
    defaultValue: 0,
    interfaceName: oneD,
    unit: 'seconds',
  },
  speed: {
    min: 0,
    max: 2,
    stepSize: 0.0125,
    defaultValue: 1,
    interfaceName: oneD,
    unit: 'playback rate',
  },
  start: {
    // should be set from sample length
    min: 0,
    max: 1,
    stepSize: 0.0125,
    defaultValue: 0,
    interfaceName: oneD,
    unit: 'seconds',
  },
  sustain: {
    min: 0,
    max: 1,
    stepSize: 0.125,
    defaultValue: 0.9,
    interfaceName: oneD,
    unit: 'gain',
  },
  threshold: {
    min: -60,
    max: 0,
    stepSize: 1,
    defaultValue: -12,
    interfaceName: oneD,
    unit: 'decibels',
  },
  path: {
    min: null,
    max: null,
    stepSize: null,
    defaultValue: '',
    interfaceName: filepath,
  },
};

// nodes defined in cracked library that euclip supports for TrackNodes and TrackControls
export const supportedAudioNodes = [
  'adsr',
  'allpasss',
  'bandpass',
  'bitcrusher',
  'channelStrip',
  'comb',
  'compressor',
  'delay',
  'gain',
  'highpass',
  'highshelf',
  'lfo',
  'lowshelf',
  'lowpass',
  'notch',
  'overdrive',
  'panner',
  'peaking',
  'reverb',
  'ring',
  'sampler',
  'sine',
  'square',
  'saw',
  'sawtooth',
  'triangle',
  'waveshaper',
  'noise',
  'pink',
  'white',
  'brown',
  'polysynth',
];
