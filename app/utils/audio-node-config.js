const filterAttrs = {
  attributeNames: {
    frequency: [20, 10000, 10000, 'slider'],
    q: [0, 20, 0, 'slider']
  }
}

const gainableFilterAttrs = {
  attributeNames: {
    ...filterAttrs.attributeNames,
    gain: [0, 16, 0, 'slider']
  }
}

const oscillatorAttrs = {
  attributeNames: ['frequency', 'detune'],
};

export const AudioNodeConfig = {
  adsr: {
    attributeNames: ['attack', 'decay', 'sustain', 'release'],
  },
  allpasss: {
    ...filterAttrs,
  },
  bandpass: {
    ...filterAttrs,
  },
  bitcrusher: {
    attributeNames: ['frequency', 'bits'],
  },
  comb: {
    attributeNames: ['delay', 'damping', 'cutoff', 'feedback'],
  },
  compressor: {
    attributeNames: ['threshold', 'knee', 'ratio', 'attack', 'release'],
  },
  channelStrip: {
    attributeNames: ['gain', 'pan']
  },
  delay: {
    attributeNames: ['delay', 'damping', 'feedback', 'cutoff', 'frequency'],
  },
  gain: {
    attributeNames: ['gain'],
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
    attributeNames: ['frequency', 'gain'],
  },
  overdrive: {
    attributeNames: ['drive', 'color', 'postCut'],
  },
  panner: {
    attributeNames: ['pan'],
  },
  reverb: {
    attributeNames: ['seconds', 'decay', 'reverse'],
  },
  ring: {
    attributeNames: ['distortion', 'frequency'],
  },
  sampler: {
    attributeNames: ['speed', 'start', 'end', 'path'],
  },
  sawtooth: {
    ...oscillatorAttrs,
  },
  sine: {
    ...oscillatorAttrs,
  },
  square: {},
  triangle: {
    ...oscillatorAttrs,
  },
};

const bool = ['toggle']
const oneD = ['slider', 'dial', 'multislider'];
const twoD = ['position']; // control 2 attributes
const tonal = ['piano'];
const array = ['envelope']
const filepath = ['filepath']

export const NodeAttrControlConfig = {
  'attack': {
    min: 0.003,
    max: 1,
    defaultValue: 6,
    interfaceOptions: oneD,
  },
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
  'decay': {
    min: 0,
    max: 4,
    defaultValue: 0,
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
  'release': {
    min: 0,
    max: 1,
    defaultValue: .25,
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