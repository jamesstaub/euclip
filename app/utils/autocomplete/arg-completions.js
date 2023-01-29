/**
 * Parsed JSDocs from cracked repo parse-doc.js
 * attributes passed to codemirror autocomplete when typing attributes of cracked nodes
 */
export const argCompletions = {
  exec: [
    {
      label: 'method',
      type: 'String',
      detail: 'method name',
      defaultValue: undefined,
    },
    {
      label: 'args',
      type: 'Array',
      detail: 'arguments to supply to the method',
      defaultValue: undefined,
    },
    {
      label: 'nodes',
      type: 'Array',
      detail: 'node array to execute against',
      defaultValue: undefined,
    },
  ],
  each: [
    {
      label: 'type',
      type: 'String',
      detail: 'string to be checked against the node type',
      defaultValue: undefined,
    },
    {
      label: 'fn',
      type: 'Function',
      detail: 'function to be called on each node',
      defaultValue: undefined,
    },
  ],
  filter: [
    {
      label: 'selector',
      type: 'String',
      detail: 'selector expression',
      defaultValue: undefined,
    },
  ],
  find: [
    {
      label: 'selector',
      type: 'String',
      detail: 'selector expression',
      defaultValue: undefined,
    },
  ],
  ramp: [
    {
      label: 'target',
      type: 'Number|Array',
      detail: 'value to ramp to',
      defaultValue: undefined,
    },
    {
      label: 'timeToRamp',
      type: 'Number|Array',
      detail: 'length of ramp in seconds',
      defaultValue: undefined,
    },
    {
      label: 'paramToRamp',
      type: 'String',
      detail: 'name of parameter to ramp',
      defaultValue: undefined,
    },
    {
      label: 'initial',
      type: 'Number',
      detail: 'value to start the ramp at',
      defaultValue: undefined,
    },
    {
      label: 'type',
      type: 'String',
      detail: 'of ramp, "exp" is exponential. defaults to linear.',
      defaultValue: undefined,
    },
  ],
  attr: [],
  script: [],
  waveshaper: [],
  compressor: [
    {
      label: 'userParams.threshold',
      type: 'Number',
      detail: 'in decibels, nominal range of -100 to 0.',
      defaultValue: '-24',
    },
    {
      label: 'userParams.knee',
      type: 'Number',
      detail: 'in decibels, range of 0 to 40',
      defaultValue: '30',
    },
    {
      label: 'userParams.ratio',
      type: 'Number',
      detail: 'nominal range of 1 to 20',
      defaultValue: '12',
    },
    {
      label: 'userParams.attack',
      type: 'Number',
      detail: 'time in seconds, nominal range of 0 to 1',
      defaultValue: '0.003',
    },
    {
      label: 'userParams.release',
      type: 'Number',
      detail: 'time in seconds, nominal range of 0 to 1',
      defaultValue: '0.250',
    },
  ],
  gain: [
    {
      label: 'userParams.threshold',
      type: 'Number',
      detail: 'in decibels, nominal range of -100 to 0.',
      defaultValue: '-24',
    },
  ],
  native_delay: [
    {
      label: 'userParams.delay',
      type: 'Number',
      detail: 'in seconds.',
      defaultValue: '0',
    },
  ],
  osc: [],
  biquadFilter: [],
  channelMerger: [],
  channelSplitter: [],
  convolver: [
    {
      label: 'userParams.path',
      type: 'String',
      detail: 'path to remote impulse',
      defaultValue: undefined,
    },
    {
      label: 'userParams.fn',
      type: 'Function',
      detail: 'function to generate impulse',
      defaultValue: undefined,
    },
  ],
  stereoPanner: [],
  destination: [],
  origin: [],
  loop: [
    {
      label: 'arg',
      type: 'String',
      detail: 'stop/start/reset commands',
      defaultValue: undefined,
    },
    {
      label: 'config.interval',
      type: 'Number',
      detail: 'step length in ms',
      defaultValue: '100',
    },
  ],
  bind: [
    {
      label: 'eventType',
      type: 'String',
      detail: 'currently just "step"',
      defaultValue: undefined,
    },
    {
      label: 'fn',
      type: 'Function',
      detail: 'callback to be invoked at each step',
      defaultValue: undefined,
    },
    {
      label: 'data',
      type: 'Array',
      detail: 'should the same length as the number of steps',
      defaultValue: undefined,
    },
  ],
  begin: [
    {
      label: 'name',
      type: 'String',
      detail: 'macro name',
      defaultValue: undefined,
    },
  ],
  end: [
    {
      label: 'name',
      type: 'String',
      detail: 'macro name',
      defaultValue: undefined,
    },
  ],
  connect: [
    {
      label: 'selector',
      type: 'String',
      detail: 'selector expression',
      defaultValue: undefined,
    },
  ],
  remove: [
    {
      label: 'time',
      type: 'Number',
      detail: 'in ms to schedule node removal',
      defaultValue: undefined,
    },
  ],
  ifUndef: [
    {
      label: 'test',
      type: '*',
      detail: 'thing to test for undefined',
      defaultValue: undefined,
    },
    {
      label: 'def',
      type: '*',
      detail: 'default value to return if test is undefined',
      defaultValue: undefined,
    },
  ],
  isNotUndef: [
    {
      label: 'test',
      type: '*',
      detail: 'thing to test for undefined',
      defaultValue: undefined,
    },
  ],
  isUndef: [
    {
      label: 'test',
      type: '*',
      detail: 'thing to test for undefined',
      defaultValue: undefined,
    },
  ],
  isObj: [
    {
      label: 'obj',
      type: '*',
      detail: 'thing to test',
      defaultValue: undefined,
    },
  ],
  isNum: [
    {
      label: 'num',
      type: '*',
      detail: 'thing to test',
      defaultValue: undefined,
    },
  ],
  isStr: [
    {
      label: 'str',
      type: '*',
      detail: 'thing to test',
      defaultValue: undefined,
    },
  ],
  isArr: [
    {
      label: 'arr',
      type: '*',
      detail: 'thing to test',
      defaultValue: undefined,
    },
  ],
  isFun: [
    {
      label: 'fn',
      type: '*',
      detail: 'thing to test',
      defaultValue: undefined,
    },
  ],
  random_interval: [
    {
      label: 'callback',
      type: 'Function',
      detail: 'to be invoked at every interval',
      defaultValue: undefined,
    },
    {
      label: 'minTime',
      type: 'Number',
      detail: 'minimum value for the random interval',
      defaultValue: undefined,
    },
    {
      label: 'maxTime',
      type: 'Number',
      detail: 'maximum value for the random interval',
      defaultValue: undefined,
    },
  ],
  random_envelope: [
    {
      label: 'length',
      type: 'Number',
      detail: 'in sec',
      defaultValue: undefined,
    },
  ],
  fill_array: [
    {
      label: 'size',
      type: 'Number',
      detail: 'of the array to be filled',
      defaultValue: undefined,
    },
    {
      label: 'fn',
      type: 'Function',
      detail: "to provide the value, if absent then array is filled with 0's.",
      defaultValue: undefined,
    },
  ],
  array_next: [
    {
      label: 'arr',
      type: 'Array',
      detail: 'to loop over',
      defaultValue: undefined,
    },
    {
      label: 'offset',
      type: 'Number',
      detail: 'added to index',
      defaultValue: undefined,
    },
    {
      label: 'limit',
      type: 'Number',
      detail: 'upper bound to iteration',
      defaultValue: undefined,
    },
    {
      label: 'callback',
      type: 'Function',
      detail: 'invoked when the count resets',
      defaultValue: undefined,
    },
  ],
  scales: [
    {
      label: 'type',
      type: 'String',
      detail: 'scale type',
      defaultValue: undefined,
    },
  ],
  chords: [
    {
      label: 'type',
      type: 'String',
      detail: 'scale type',
      defaultValue: undefined,
    },
  ],
  sequence: [
    {
      label: 'name',
      type: 'String',
      detail: 'name of sequence',
      defaultValue: undefined,
    },
  ],
  reverb: [
    {
      label: 'params.reverse',
      type: 'Boolean',
      detail: 'reverse reverb',
      defaultValue: 'false',
    },
    {
      label: 'params.path',
      type: 'String',
      detail: 'path to impulse file. if no path, impulse is generated.',
      defaultValue: undefined,
    },
    {
      label: 'params.seconds',
      type: 'Number',
      detail: 'if generated impulse, length in seconds.',
      defaultValue: '3',
    },
    {
      label: 'params.decay',
      type: 'Number',
      detail: 'if generated impulse, length of decay in seconds',
      defaultValue: '2',
    },
    {
      label: 'params.fn',
      type: 'Function',
      detail: 'custom function to generate an impulse buffer',
      defaultValue: 'buildImpulse',
    },
  ],
  delay: [
    {
      label: 'params.delay',
      type: 'Number',
      detail: 'delay time in seconds',
      defaultValue: '1',
    },
    {
      label: 'params.damping',
      type: 'Number',
      detail: 'feedback input gain',
      defaultValue: '0.84',
    },
    {
      label: 'params.cutoff',
      type: 'Number',
      detail: 'frequency of lowpass filtering on feedback loop',
      defaultValue: '1500',
    },
    {
      label: 'params.feedback',
      type: 'Number',
      detail: 'feedback gain output',
      defaultValue: '0.5',
    },
  ],
  comb: [
    {
      label: 'params.delay',
      type: 'Number',
      detail: 'delay time in seconds',
      defaultValue: '0.027',
    },
    {
      label: 'params.damping',
      type: 'Number',
      detail: 'feedback input gain',
      defaultValue: '0.84',
    },
    {
      label: 'params.cutoff',
      type: 'Number',
      detail: 'frequency of lowpass filtering on feedback loop',
      defaultValue: '3000',
    },
    {
      label: 'params.feedback',
      type: 'Number',
      detail: 'feedback gain output',
      defaultValue: '0.84',
    },
  ],
  bitcrusher: [
    {
      label: 'params.frequency',
      type: 'Number',
      detail: 'normalized frequency (0 - 1)',
      defaultValue: '0.1',
    },
    {
      label: 'params.bits',
      type: 'Number',
      detail: 'bits',
      defaultValue: '6',
    },
  ],
  ring: [
    {
      label: 'params.distortion',
      type: 'Number',
      detail: 'distortion curve',
      defaultValue: '1',
    },
    {
      label: 'params.frequency',
      type: 'Number',
      detail: 'modulation frequenct',
      defaultValue: '30',
    },
  ],
  overdrive: [
    {
      label: 'params.drive',
      type: 'Number',
      detail: 'distortion curve',
      defaultValue: '0.5',
    },
    {
      label: 'params.color',
      type: 'Number',
      detail: 'pre-distortion bandpass frequency in hz',
      defaultValue: '800',
    },
    {
      label: 'params.postCut',
      type: 'Number',
      detail: 'post lowpass frequency in hz',
      defaultValue: '3000',
    },
  ],
  adsr: [
    {
      label: 'userParams',
      type: 'Array',
      detail: '5 values: attack,decay,sustain,hold,release',
      defaultValue: undefined,
    },
    {
      label: '',
      type: 'Array',
      detail: '[userParams] 4 values: attack,decay,sustain,release',
      defaultValue: undefined,
    },
    {
      label: 'userParams',
      type: 'Array',
      detail: '3 values: attack,decay,sustain (holds until released)',
      defaultValue: undefined,
    },
    {
      label: 'userParams',
      type: 'String',
      detail: '"slow" or "fast"',
      defaultValue: undefined,
    },
    {
      label: 'userParams',
      type: 'Number',
      detail: 'length of the total envelope',
      defaultValue: '0.5',
    },
  ],
  lowpass: [
    {
      label: 'params.frequency',
      type: 'Number',
      detail: 'frequency',
      defaultValue: '440',
    },
    {
      label: 'params.q',
      type: 'Number',
      detail: 'Q',
      defaultValue: '0',
    },
  ],
  highpass: [
    {
      label: 'params.frequency',
      type: 'Number',
      detail: 'frequency',
      defaultValue: '440',
    },
    {
      label: 'params.q',
      type: 'Number',
      detail: 'Q',
      defaultValue: '0',
    },
  ],
  bandpass: [
    {
      label: 'params.frequency',
      type: 'Number',
      detail: 'frequency',
      defaultValue: '440',
    },
    {
      label: 'params.q',
      type: 'Number',
      detail: 'Q',
      defaultValue: '0',
    },
  ],
  lowshelf: [
    {
      label: 'params.frequency',
      type: 'Number',
      detail: 'frequency',
      defaultValue: '440',
    },
    {
      label: 'params.q',
      type: 'Number',
      detail: 'Q',
      defaultValue: '0',
    },
    {
      label: 'params.gain',
      type: 'Number',
      detail: 'gain',
      defaultValue: '0',
    },
  ],
  highshelf: [
    {
      label: 'params.frequency',
      type: 'Number',
      detail: 'frequency',
      defaultValue: '440',
    },
    {
      label: 'params.q',
      type: 'Number',
      detail: 'Q',
      defaultValue: '0',
    },
    {
      label: 'params.gain',
      type: 'Number',
      detail: 'gain',
      defaultValue: '0',
    },
  ],
  peaking: [
    {
      label: 'params.frequency',
      type: 'Number',
      detail: 'frequency',
      defaultValue: '440',
    },
    {
      label: 'params.q',
      type: 'Number',
      detail: 'Q',
      defaultValue: '0',
    },
    {
      label: 'params.gain',
      type: 'Number',
      detail: 'gain',
      defaultValue: '0',
    },
  ],
  notch: [
    {
      label: 'params.frequency',
      type: 'Number',
      detail: 'frequency',
      defaultValue: '440',
    },
    {
      label: 'params.q',
      type: 'Number',
      detail: 'Q',
      defaultValue: '0',
    },
  ],
  allpass: [
    {
      label: 'params.frequency',
      type: 'Number',
      detail: 'frequency',
      defaultValue: '440',
    },
    {
      label: 'params.q',
      type: 'Number',
      detail: 'Q',
      defaultValue: '0',
    },
  ],
  dac: [
    {
      label: 'params',
      type: 'Number',
      detail: 'system out gain',
      defaultValue: '1',
    },
  ],
  adc: [
    {
      label: 'params',
      type: 'Number',
      detail: 'system in gain',
      defaultValue: '1',
    },
  ],
  out: [
    {
      label: 'params',
      type: 'Number',
      detail: 'system out gain',
      defaultValue: '1',
    },
  ],
  multi_out: [],
  in: [
    {
      label: 'params',
      type: 'Number',
      detail: 'system in gain',
      defaultValue: '1',
    },
  ],
  panner: [],
  sampler: [
    {
      label: 'userParams.speed',
      type: 'Number',
      detail: 'playback rate. 1 is normal, -1 is reverse',
      defaultValue: '1',
    },
    {
      label: 'userParams.start',
      type: 'Number',
      detail: 'play head start value in seconds]',
      defaultValue: '0',
    },
    {
      label: 'userParams.end',
      type: 'Number',
      detail: 'play head end value in seconds',
      defaultValue: '1',
    },
    {
      label: 'userParams.path',
      type: 'String',
      detail: 'path to sound file to play',
      defaultValue: "''",
    },
    {
      label: 'userParams.loop',
      type: 'Boolean',
      detail: 'soundfile loops',
      defaultValue: 'false',
    },
  ],
  lfo: [
    {
      label: 'userParams.modulates',
      type: 'String',
      detail: 'the parameter of the target node to modulate',
      defaultValue: 'frequency',
    },
    {
      label: 'userParams.type',
      type: 'String',
      detail:
        'LFO waveform (sine, sawtooth, square, triangle, white, pink, brown)',
      defaultValue: 'sawtooth',
    },
    {
      label: 'userParams.frequency',
      type: 'Number',
      detail: 'rate of the LFO in hz',
      defaultValue: '6',
    },
    {
      label: 'userParams.gain',
      type: 'Number',
      detail: 'the gain or amplitude of the LFO',
      defaultValue: '1000',
    },
  ],
  stepper: [
    {
      label: 'params.fn',
      type: 'Function',
      detail:
        'function to generate values (if not supplied, then random values between -1 & 1)',
      defaultValue: 'fn',
    },
    {
      label: 'params.steps',
      type: 'Number',
      detail: 'number of steps in the buffer',
      defaultValue: '8',
    },
    {
      label: 'params.length',
      type: 'Number',
      detail: 'length of the buffer in seconds',
      defaultValue: '1',
    },
    {
      label: 'params.gain',
      type: 'Number',
      detail: 'gain value',
      defaultValue: '1000',
    },
  ],
  noise: [
    {
      label: 'params.type',
      type: 'String',
      detail: 'noise type [white, pink, brown]',
      defaultValue: 'white',
    },
  ],
  pink: [
    {
      label: 'params.channels',
      type: 'Number',
      detail: 'number of channels of noise buffer',
      defaultValue: '1',
    },
    {
      label: 'params.length',
      type: 'Number',
      detail: 'length in seconds of noise buffer',
      defaultValue: '1',
    },
  ],
  white: [
    {
      label: 'params.channels',
      type: 'Number',
      detail: 'number of channels of noise buffer',
      defaultValue: '1',
    },
    {
      label: 'params.length',
      type: 'Number',
      detail: 'length in seconds of noise buffer',
      defaultValue: '1',
    },
  ],
  brown: [
    {
      label: 'params.channels',
      type: 'Number',
      detail: 'number of channels of noise buffer',
      defaultValue: '1',
    },
    {
      label: 'params.length',
      type: 'Number',
      detail: 'length in seconds of noise buffer',
      defaultValue: '1',
    },
  ],
  sine: [
    {
      label: 'params.frequency',
      type: 'Number',
      detail: 'frequency in hz of the oscillator',
      defaultValue: '440',
    },
    {
      label: 'params.detune',
      type: 'Number',
      detail: 'detune amount in cents',
      defaultValue: '0',
    },
    {
      label: 'params.type',
      type: 'String',
      detail: 'oscillator type',
      defaultValue: 'sine',
    },
  ],
  square: [
    {
      label: 'params.frequency',
      type: 'Number',
      detail: 'frequency in hz of the oscillator',
      defaultValue: '440',
    },
    {
      label: 'params.detune',
      type: 'Number',
      detail: 'detune amount in cents',
      defaultValue: '0',
    },
    {
      label: 'params.type',
      type: 'String',
      detail: 'oscillator type',
      defaultValue: 'sine',
    },
  ],
  saw: [
    {
      label: 'params.frequency',
      type: 'Number',
      detail: 'frequency in hz of the oscillator',
      defaultValue: '440',
    },
    {
      label: 'params.detune',
      type: 'Number',
      detail: 'detune amount in cents',
      defaultValue: '0',
    },
    {
      label: 'params.type',
      type: 'String',
      detail: 'oscillator type',
      defaultValue: 'sine',
    },
  ],
  triangle: [
    {
      label: 'params.frequency',
      type: 'Number',
      detail: 'frequency in hz of the oscillator',
      defaultValue: '440',
    },
    {
      label: 'params.detune',
      type: 'Number',
      detail: 'detune amount in cents',
      defaultValue: '0',
    },
    {
      label: 'params.type',
      type: 'String',
      detail: 'oscillator type',
      defaultValue: 'sine',
    },
  ],
  frequency: [
    {
      label: 'userParam',
      type: 'Number',
      detail: 'frequency to set',
      defaultValue: undefined,
    },
  ],
  detune: [
    {
      label: 'userParam',
      type: 'Number',
      detail: 'detune frequency to set',
      defaultValue: undefined,
    },
  ],
  type: [
    {
      label: 'userParam',
      type: 'String',
      detail: 'oscillator type to set',
      defaultValue: undefined,
    },
  ],
  volume: [
    {
      label: 'userParam',
      type: 'Number',
      detail: 'gain to set',
      defaultValue: undefined,
    },
  ],
  fadeOut: [
    {
      label: 'userParam',
      type: 'Number',
      detail: 'optional time to set in seconds. Defaults to 0.02',
      defaultValue: undefined,
    },
  ],
  fadeIn: [
    {
      label: 'userParam',
      type: 'Number',
      detail: 'optional time to set in seconds. Defaults to 0.02',
      defaultValue: undefined,
    },
  ],
  time: [
    {
      label: 'userParam',
      type: 'Number',
      detail: 'delay time to set',
      defaultValue: undefined,
    },
  ],
  feedback: [
    {
      label: 'userParam',
      type: 'Number',
      detail: 'feedback amount to set',
      defaultValue: undefined,
    },
  ],
  speed: [
    {
      label: 'userParam',
      type: 'Number',
      detail: 'sampler speed to set',
      defaultValue: undefined,
    },
  ],
  drive: [
    {
      label: 'userParam',
      type: 'Number',
      detail: 'drive distortion/waveshaper/etc to set',
      defaultValue: undefined,
    },
  ],
  distortion: [
    {
      label: 'userParam',
      type: 'Number',
      detail: 'distortion to set',
      defaultValue: undefined,
    },
  ],
  q: [
    {
      label: 'userParam',
      type: 'Number',
      detail: 'q value to set',
      defaultValue: undefined,
    },
  ],
  pan: [
    {
      label: 'userParam',
      type: 'Number',
      detail: 'pan value (1 to -1) to set',
      defaultValue: undefined,
    },
  ],
  gang_of_oscillators: [],
  monosynth: [],
  polysynth: [],
  scale: [
    {
      label: 'position',
      type: 'Number',
      detail: 'number to scale',
      defaultValue: undefined,
    },
    {
      label: 'inMin',
      type: 'Number',
      detail: 'input min',
      defaultValue: undefined,
    },
    {
      label: 'inMax',
      type: 'Number',
      detail: 'input max',
      defaultValue: undefined,
    },
    {
      label: 'outMin',
      type: 'Number',
      detail: 'scaled min',
      defaultValue: undefined,
    },
    {
      label: 'outMax',
      type: 'Number',
      detail: 'scaled max',
      defaultValue: undefined,
    },
    {
      label: 'type',
      type: 'String',
      detail: '"linear" or "logarithmic"',
      defaultValue: undefined,
    },
  ],
};