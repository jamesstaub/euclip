/**
 * The script reference's entries, in one place: what the panel shows and what the test checks against
 * the functions script-api.ts exposes. (The words for the panel's own parts are in reference-text.ts.)
 *
 * Keep `name` equal to the function's name: tests/unit/help/reference-test.ts fails for a function
 * without an entry and an entry without a function.
 */
export interface ReferenceOption {
  name: string;
  type: string;
  description: string;
}

export interface ReferenceEntry {
  name: string;
  signature: string;
  summary: string;
  options: readonly ReferenceOption[];
  /** two to four lines, as they would be written in a script */
  example: string;
}

const LABEL: ReferenceOption = {
  name: 'label',
  type: 'string',
  description:
    'What the control is called on screen. Default: the parameter’s name.',
};

const NUMBER_OPTIONS: readonly ReferenceOption[] = [
  LABEL,
  { name: 'min', type: 'number', description: 'The low end of the range.' },
  { name: 'max', type: 'number', description: 'The high end of the range.' },
  {
    name: 'step',
    type: 'number',
    description: 'Stepped mode: the distance between values.',
  },
  {
    name: 'values',
    type: 'number[]',
    description: 'Stepped mode: the only values allowed.',
  },
  {
    name: 'mode',
    type: 'string',
    description:
      'The unit the control starts in: for a frequency "hz", "note" or "cents"; for a level "linear" or "decibels"; for a time "seconds", "ms" or "steps".',
  },
  {
    name: 'glide',
    type: 'number | control',
    description:
      'Seconds the parameter takes to get to where the control is put, or a control of your own that says.',
  },
  {
    name: 'perStep',
    type: 'string | true',
    description:
      'The sequence the control’s lane follows: steps can hold values of their own. true is the script’s first.',
  },
];

const OWN_OPTIONS: readonly ReferenceOption[] = [
  {
    name: 'default',
    type: 'number',
    description: 'With a name: the value it starts at.',
  },
];

export const REFERENCE_FUNCTIONS: readonly ReferenceEntry[] = [
  {
    name: 'slider',
    signature:
      'slider(target, param, options?)  |  slider(name, { min, max, default })',
    summary:
      'A slider for a node’s parameter, or, with a name, a control of its own. Returns the control: .value reads it and .set(v) moves it.',
    options: [...NUMBER_OPTIONS, ...OWN_OPTIONS],
    example: `slider('#filter', 'frequency', { mode: 'note' });
const density = slider('density', { min: 0, max: 1, default: 0.5 });`,
  },
  {
    name: 'knob',
    signature:
      'knob(target, param, options?)  |  knob(name, { min, max, default })',
    summary: 'The same as slider, drawn as a dial.',
    options: [...NUMBER_OPTIONS, ...OWN_OPTIONS],
    example: `knob('#level', 'gain', { label: 'level' });`,
  },
  {
    name: 'toggle',
    signature: 'toggle(target, param, options?)  |  toggle(name, { default })',
    summary:
      'An on or off switch for a true-or-false parameter, or, with a name, a switch of its own.',
    options: [
      LABEL,
      {
        name: 'default',
        type: 'boolean',
        description: 'With a name: whether it starts on.',
      },
    ],
    example: `toggle('#sampler', 'loop');
const fills = toggle('fills', { default: false });`,
  },
  {
    name: 'select',
    signature: 'select(target, param, options?)',
    summary: 'A menu for a parameter that takes one of a list of values.',
    options: [LABEL],
    example: `select('#osc', 'shape', { label: 'wave' });`,
  },
  {
    name: 'controls',
    signature: 'controls()  |  controls(target, names?)',
    summary:
      'Declares controls in one line: with nothing, for everything the script has made; with a target, for its parameters (or only the names given). Each parameter gets the kind that suits it.',
    options: [],
    example: `controls();
controls('#kick', ['speed', 'start']);`,
  },
  {
    name: 'stepGrid',
    signature: 'stepGrid(name, options?)',
    summary:
      'A step grid for a named sequence of this script. Put it after the __.transport.sequence call. The grid owns the pattern: it starts empty and keeps what is set in it.',
    options: [
      LABEL,
      {
        name: 'view',
        type: 'string',
        description: 'How its steps are drawn: "toggles".',
      },
    ],
    example: `__.transport.sequence('steps', { steps: 16, step: '1/16' }, cb);
stepGrid('steps');`,
  },
  {
    name: 'waveform',
    signature: 'waveform(target, options?)',
    summary:
      'A waveform editor for a sampler, in the track’s source pane: start, end, loop points, slices and which sound it plays.',
    options: [LABEL],
    example: `waveform('#sampler');`,
  },
  {
    name: 'synth',
    signature: 'synth(target, options?)',
    summary:
      'A synth editor for an oscillator or a synth macro: a scope, a keyboard that sets its pitch and plays it, and its other controls.',
    options: [
      LABEL,
      {
        name: 'pitch',
        type: 'string',
        description: 'The parameter the keyboard sets. Default: "frequency".',
      },
    ],
    example: `synth('#synth');
slider('#synth', 'cutoff');`,
  },
];

/** The little of cracked-up the templates use, in the shape of a template. */
export const REFERENCE_BASICS: ReferenceEntry = {
  name: 'chain',
  signature:
    "__()  .to('channel')  __.transport.sequence(name, { steps, step }, callback)",
  summary:
    "__() starts a chain of nodes, each call adds one; .to('channel') sends the chain to the track’s channel strip; __.transport.sequence calls back on every step, and the callback triggers a node.",
  options: [],
  example: `__()
  .sampler({ id: 'sampler' })
  .to('channel');
__.transport.sequence('steps', { steps: 16, step: '1/16' }, (ev) => {
  if (ev.value) __('#sampler').trigger();
});`,
};
