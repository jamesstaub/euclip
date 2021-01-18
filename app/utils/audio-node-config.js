const filterAttrs = {
  attributes: {
    frequency: [20, 10000, 10000, 'slider'],
    q: [0, 20, 0, 'slider']
  }
}

const gainfilterAttrs = {
  attributes: {
    ...filterAttrs.attributes,
    gain: [0, 16, 0, 'slider']
  }
}

const oscillatorAttrs = {
  attributes: ['frequency', 'detune'],
};

export const AudioNodeConfig = {
  bitcrusher: {
    attributes: ['frequency', 'bits'],
  },
  comb: {
    attributes: ['delay', 'damping', 'cutoff', 'feedback'],
  },
  compressor: {
    attributes: ['threshold', 'knee', 'ratio', 'attack', 'release'],
  },
  delay: {
    attributes: ['delay', 'damping', 'feedback', 'cutoff', 'frequency'],
  },
  gain: {
    attributes: ['gain'],
  },
  lowpass: {
    ...filterAttrs,
  },
  highpass: {
    ...filterAttrs,
  },
  bandpass: {
    ...filterAttrs,
  },
  lowshelf: {
    ...gainfilterAttrs,
  },
  highshelf: {
    ...gainfilterAttrs,
  },
  peaking: {
    ...gainfilterAttrs,
  },
  notch: {
    ...filterAttrs,
  },
  allpasss: {
    ...filterAttrs,
  },
  lfo: {
    attributes: ['frequency', 'gain'],
  },
  overdrive: {
    attributes: ['drive', 'color', 'postCut'],
  },
  panner: {
    attributes: ['pan'],
  },
  reverb: {
    attributes: ['seconds', 'decay', 'reverse'],
  },
  ring: {
    attributes: ['distortion', 'frequency'],
  },
  sampler: {
    attributes: ['speed', 'start', 'end', 'path'],
  },
  sine: {
    ...oscillatorAttrs,
  },
  square: {},
  triangle: {
    ...oscillatorAttrs,
  },
  sawtooth: {
    ...oscillatorAttrs,
  },
};