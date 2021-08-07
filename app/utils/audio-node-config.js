// groups of interfaces for different params
const bool = ['toggle']
const oneD = ['slider', 'dial', 'multislider'];
const twoD = ['position']; // control 2 attributes
const tonal = ['piano'];
const array = ['envelope']
const filepath = ['filepath']


// attr: min, max, defaultValue, interfaceOptions 
const filterAttrs = {
  frequency: [20, 10000, 10000, oneD],
  q: [0, 20, 0, oneD]
}

const gainableFilterAttrs = {
  ...filterAttrs,
  gain: [0, 16, 0, oneD]
}

const envelopeAttrs = {
  attack: [0.003, 1, .0125, oneD],
  decay: [0, 4, 0, oneD],
  release: [0, 1, .25, oneD],
}

const oscillatorAttrs = {
   frequency: [0, 20000, 440, oneD]
}

// TODO: abstract the values of defaultParams (below)
// and populate the min/max/defaultValue/defaultInterface of AudioNodeConfig 
// and this should be the source of truth for all nodes + control configs
export const AudioNodeConfig = {
  adsr: {
    ...envelopeAttrs,
    sustain: [], // todo is sustain level gain or db?
  },
  allpasss: {
    ...filterAttrs,
  },
  bandpass: {
    ...filterAttrs,
  },
  bitcrusher: {
    frequency: [],
    bits: [],
  },
  comb: {
    delay: [0, 6, 1, oneD],
    damping: [0, 1, 0.84, oneD],
    cutoff: [], 
    feedback: [0, 1, 0.25, oneD],
  },
  compressor: {
    threshold: [],
    knee: [0, 40, 30, oneD], 
    ratio: [1, 20, 12, oneD], 
    attack: envelopeAttrs.attack, 
    release: envelopeAttrs.release, 
  },
  channelStrip: {
    gain: [],
    pan: [],
  },
  delay: {
    delay: [0, 6, 1, oneD],
    damping: [0, 1, 0.84, oneD],
    feedback: [0, 1, 0.25, oneD], 
    cutoff: [40, 10000, 10000, oneD], 
    frequency: [],
  },
  gain: {
    gain: [0, 1, 1, oneD],
  },
  highpass: {
    ...filterAttrs,
  },
  lowpass: {
    ...filterAttrs,
  },
  lowshelf: {
    ...gainableFilterAttrs,
  },
  highshelf: {
    ...gainableFilterAttrs,
  },
  peaking: {
    ...gainableFilterAttrs,
  },
  notch: {
    ...filterAttrs,
  },
  lfo: {
    frequency: [0, 20, 5, oneD],
    gain: [0, 100, 10, oneD], // TODO: do we need LFO presets to be dynamic per their modulator?
  },
  overdrive: {
    drive: [0, 2, 0.5, oneD],
    color: [0, 1000, 800, oneD],
    postCut: [0, 20000, 10000, oneD],
  },
  panner: {
    pan: [-1, 1, 0, oneD],
  },
  reverb: {
    // seconds: [],
    // decay: [],
    reverse:[null, null, null, bool],
  },
  ring: {
    distortion: [],
    frequency: [],
  },
  sampler: {
    speed: [-2, 2, 1, oneD],
    start: [0, 1, 0, oneD], 
    end: [0, 1, 1, oneD], 
    path: [null, null, null, filepath],
  },
  sawtooth: {
    ...oscillatorAttrs,
  },
  sine: {
    ...oscillatorAttrs,
  },
  square: {
    ...oscillatorAttrs,
  },
  triangle: {
    ...oscillatorAttrs,
  },
};

export const defaultParams = {
  'bits': {
    min: 1,
    max: 16,
    defaultValue: 6,
    interfaceOptions: oneD,
  },
  channelStrip: {
    interfaceOptions: ['slider']
  },
  'color': {
    min: 0,
    max: 1000,
    defaultValue: 800,
    interfaceOptions: oneD,
  },
  'cutoff': {
    min: 0,
    max: 4000,
    defaultValue: 1500,
    interfaceOptions: oneD,
  },
  'damping': {
    min: 0,
    max: 1,
    defaultValue: 0.84,
    interfaceOptions: oneD,
  },
  'delay': {
    min: 0,
    max: 6,
    defaultValue: 2,
    interfaceOptions: oneD,
  },
  'detune': {
    min: 0,
    max: 100,
    defaultValue: 0,
    interfaceOptions: oneD,
  },
  'distortion': {
    min: 0,
    max: 3,
    defaultValue: 1,
    interfaceOptions: oneD,
  },
  'drive': {
    min: 0,
    max: 2,
    defaultValue: .5,
    interfaceOptions: oneD,
  },
  'end': {
    min: 0,
    max: 1,
    defaultValue: 1,
    interfaceOptions: oneD,
  },
  'feedback': {
    min: 0,
    max: 1,
    defaultValue: 0,
    interfaceOptions: oneD,
  },
  'frequency': {
    lfo: {
      min:0,
      max:20,
      defaultValue:5,
      interfaceOptions: oneD,
    },
    oscillator: {
      min: 0,
      max: 10000,
      defaultValue:300,
      interfaceOptions: oneD,
    }
  },
  'gain': {
    min: 0,
    max: 1,
    defaultValue: .9,
    interfaceName: oneD,
  },
  'knee': {
    min: 0,
    max: 40,
    defaultValue: 30,
    interfaceOptions: oneD,
  },
  'pan': {
    min: -1,
    max: 1,
    defaultValue: 0,
    interfaceOptions: oneD,
  },
  'postCut': {
    min: 0,
    max: 5000,
    defaultValue: 3000,
    interfaceOptions: oneD,
  },
  'q': {
    min: 0,
    max: 20,
    defaultValue: 0,
    interfaceOptions: oneD,
  },
  'ratio': {
    min: 1,
    max: 20,
    defaultValue: 12,
    interfaceOptions: oneD,
  },
  'reverse': {
    min: 0,
    max: 1,
    defaultValue: 0,
    interfaceOptions: bool,
  },
  'seconds': {
    min: 0,
    max: 6,
    defaultValue: 0,
    interfaceOptions: oneD,
  },
  'speed': {
    min: .125,
    max: 2,
    defaultValue: 1,
    interfaceName: oneD,
  },
  'start': {
    min: 0,
    max: 1,
    defaultValue: 0,
    interfaceOptions: oneD,
  },
  'threshold': {
    min: -60,
    max: 0,
    defaultValue: -12,
    interfaceOptions: oneD,
  },
  'path': {
    interfaceOptions: filepath,
  },
}