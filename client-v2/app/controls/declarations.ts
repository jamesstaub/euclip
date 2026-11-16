/**
 * What a script's control declarations are, as plain data.
 *
 * `slider('#filter', 'frequency')` in a script produces a `Declaration`. It is plain JSON on purpose:
 * when scripts run in a sandbox it is what crosses to the page, and it is what the widget registry
 * (controls/registry.ts) turns into something on screen. Nothing here touches the DOM or the app.
 */
import { MODE_LABELS } from 'client-v2/controls/modes';
import type { StoredValue } from 'client-v2/project/schema';

/** What a widget is bound to. A kind may use several (a waveform editor: three parameters and a buffer). */
export type Binding =
  /** a parameter of the nodes a selector finds */
  | { type: 'param'; selector: string; param: string }
  /** a creation option of a node that can be changed in place: the sound a sampler plays (`buffer`) */
  | { type: 'option'; selector: string; option: string }
  /** the level of a named bus of the script's scope */
  | { type: 'bus'; name: string }
  /** a value of its own, kept in the document under a name */
  | { type: 'value'; name: string }
  /** a named sequence of the script */
  | { type: 'sequence'; name: string };

/** Options a script may give a control. All plain data. */
export interface ControlOptions {
  /** what the control is called on screen (default: the parameter's name) */
  label?: string;
  /** the slider mode to start in: 'linear', 'exponential', 'note', 'decibels' or 'stepped' */
  mode?: string;
  /** a narrower range than the parameter's own, or the range of a control with no parameter */
  min?: number;
  max?: number;
  /** stepped mode: the distance between values */
  step?: number;
  /** stepped mode: the only values allowed */
  values?: number[];
  /** a step grid: how its steps are drawn. Only 'toggles' (the default) exists so far. */
  view?: string;
  /** a control with no parameter: its unit, and the value it starts at */
  unit?: string;
  default?: StoredValue;
}

export interface Declaration {
  /** identity within the script's scope: selector and parameter, or the name of a control of its own */
  key: string;
  /** which widget draws it: a key of the widget registry */
  kind: string;
  bindings: Binding[];
  /**
   * The ids of the nodes it controls, as found when it was declared (empty for a control with no node).
   * This is what decides whether two declarations are for the same thing, however each was written.
   */
  nodes: string[];
  options: ControlOptions;
  /** made by `controls()`: it gives way to a `slider`, `knob`, `toggle` or `select` for the same node and parameter */
  implicit: boolean;
  /**
   * Part of a compound widget (a waveform editor's start, end, loop points): it is a control like any
   * other, with the key a `slider` for the same parameter would have, but it has no row of its own in
   * the controls pane. It gives way to any other declaration for the same node and parameter, which the
   * compound widget then uses.
   */
  hidden?: boolean;
  /** the line of the script it was declared on, counted from 1, when that could be told */
  line?: number;
}

/** Something wrong with one declaration. The rest of the script runs. */
export interface DeclarationWarning {
  message: string;
  line?: number;
  /** a step grid was declared for a sequence that did not exist at that point: its name */
  missingSequence?: string;
}

/**
 * The tag Euclip puts on nodes it makes itself (a track's pan). They are never a script's to control:
 * no declaration reaches them, whatever its selector.
 */
export const HOST_TAG = 'euclip';

/**
 * The bus Euclip makes for every track: where a track's script sends its sound (`.to('channel')`), and
 * what the channel strip's level and pan are on. It is the host's: a script cannot declare controls on it.
 */
export const CHANNEL_BUS = 'channel';

/** The parameters of a sampler a waveform editor is a view over, in the order it lists them. */
export const WAVEFORM_PARAMS = [
  'start',
  'end',
  'loopStart',
  'loopEnd',
  'loop',
  'reverse',
  'speed',
] as const;

/** The key part that names a waveform editor, and the sound its sampler plays, among a node's controls. */
export const WAVEFORM_PART = 'waveform';
export const BUFFER_OPTION = 'buffer';

/**
 * How one argument of a script function is described to the editor. The same shape as an argument in
 * cracked-up/editor's catalog (which this module must not import: it is only loaded with the editor).
 */
export interface ArgumentSpec {
  name: string;
  kind: 'selector' | 'param' | 'sequence' | 'name' | 'options' | 'list';
  description?: string;
  optional?: boolean;
  /** for `param`: the argument that says which nodes */
  of?: string;
  /** for `options`: the keys */
  options?: readonly OptionSpec[];
  /** for `list`: what each item is */
  items?: { kind: 'param'; of?: string };
}

export interface OptionSpec {
  name: string;
  description: string;
  type?: string;
  default?: string;
  values?: readonly (string | number | boolean)[];
}

export interface SignatureSpec {
  args: readonly ArgumentSpec[];
  description?: string;
  /** what the call gives back: `control` (value, set), `controls` (by node and parameter) or nothing */
  returns?: 'control' | 'controls';
}

/** Which kinds of parameter each script function accepts, and how the editor documents it. */
export interface ControlFunction {
  name: string;
  /** the widget it declares; `controls` chooses per parameter */
  kind: string | null;
  /** the kinds of parameter it can show; empty for a function that is not bound to a parameter */
  accepts: readonly ('number' | 'boolean' | 'choice')[];
  signature: string;
  description: string;
  /** the ways of calling it, argument by argument, for the editor's help inside its brackets */
  signatures: readonly SignatureSpec[];
}

const TARGET_ARG: ArgumentSpec = {
  name: 'target',
  kind: 'selector',
  description:
    "Which nodes: a selector ('#filter'), or a chain, a selection, a node or a bus the script has.",
};

const LABEL: OptionSpec = {
  name: 'label',
  type: 'string',
  description:
    'What the control is called on screen. Default: the parameter’s name.',
};

const NUMBER_OPTIONS: readonly OptionSpec[] = [
  LABEL,
  {
    name: 'mode',
    description:
      'The unit the control starts in; the person can change it from its menu. Which are on offer depends on the parameter.',
    values: Object.keys(MODE_LABELS),
  },
  {
    name: 'min',
    type: 'number',
    description: 'A narrower lower end than the parameter’s own.',
  },
  {
    name: 'max',
    type: 'number',
    description: 'A narrower upper end than the parameter’s own.',
  },
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
];

const OWN_NUMBER_OPTIONS: readonly OptionSpec[] = [
  ...NUMBER_OPTIONS,
  { name: 'default', type: 'number', description: 'The value it starts at.' },
  {
    name: 'unit',
    type: 'string',
    description: 'Its unit, as the library names them.',
    values: ['none', 'hz', 'gain', 'seconds', 'ratio'],
  },
];

/** The ways `slider` and `knob` are called. */
const NUMBER_SIGNATURES: readonly SignatureSpec[] = [
  {
    args: [
      TARGET_ARG,
      {
        name: 'param',
        kind: 'param',
        of: 'target',
        description: 'The parameter to control.',
      },
      {
        name: 'options',
        kind: 'options',
        optional: true,
        options: NUMBER_OPTIONS,
      },
    ],
    returns: 'control',
  },
  {
    description:
      'A control with a value of its own, kept in the project under its name.',
    args: [
      { name: 'name', kind: 'name', description: 'A name of your choosing.' },
      { name: 'options', kind: 'options', options: OWN_NUMBER_OPTIONS },
    ],
    returns: 'control',
  },
];

const OPTIONS =
  'Options: label, min, max, step, values, and mode: the unit the control starts in, which the person can change from its menu. ' +
  'What is on offer depends on the parameter: a frequency "hz", "note", "cents"; a level "linear", "decibels"; a time "seconds", "ms", "steps"; ' +
  'a sampler start or end "seconds", "ms", "percent", "slice"; a speed "ratio", "semitones", "ratio-cents"; anything else "linear", "exponential", "stepped".';

const TARGET =
  "The first argument says which nodes: a selector ('#filter', '.voice'), or what the script already has: " +
  "a chain (const kick = __().sampler(…).lowpass(…)), a selection (kick.nodes.filter('lowpass'), kick.tail, __('lowpass')) or a node. " +
  "Or a bus, for its level: slider(__.bus('drums'), 'gain').";

export const CONTROL_FUNCTIONS: readonly ControlFunction[] = [
  {
    name: 'slider',
    kind: 'slider',
    accepts: ['number'],
    signature:
      'slider(target, param, options?) | slider(name, { min, max, default })',
    description:
      "Declares a slider for a parameter: slider('#filter', 'frequency'), or slider(kick.nodes.filter('lowpass'), 'frequency'). " +
      TARGET +
      ' Several nodes get one slider that moves them together. ' +
      'Its range, unit and curve come from the parameter. Moving it sets the parameter and stores the value in the project; ' +
      'the number in the node is the default. Returns the control: .value reads it, .set(v) moves it and the parameter together. ' +
      "With a name and an object instead, a control of its own: const density = slider('density', { min: 0, max: 1, default: 0.5 }). " +
      OPTIONS,
    signatures: NUMBER_SIGNATURES,
  },
  {
    name: 'knob',
    kind: 'knob',
    accepts: ['number'],
    signature:
      'knob(target, param, options?) | knob(name, { min, max, default })',
    description:
      "Declares a knob: the same as slider(), drawn as a dial. knob('#level', 'gain', { label: 'Level' }). " +
      TARGET +
      ' ' +
      OPTIONS,
    signatures: NUMBER_SIGNATURES,
  },
  {
    name: 'toggle',
    kind: 'toggle',
    accepts: ['boolean'],
    signature: 'toggle(target, param, options?) | toggle(name, { default })',
    description:
      "Declares an on/off switch for a true-or-false parameter: toggle('#sampler', 'loop'). " +
      TARGET +
      " With a name and an object, a switch of its own: const fills = toggle('fills', { default: false }).",
    signatures: [
      {
        args: [
          TARGET_ARG,
          {
            name: 'param',
            kind: 'param',
            of: 'target',
            description: 'A true-or-false parameter.',
          },
          {
            name: 'options',
            kind: 'options',
            optional: true,
            options: [LABEL],
          },
        ],
        returns: 'control',
      },
      {
        description: 'A switch of its own, kept in the project under its name.',
        args: [
          { name: 'name', kind: 'name' },
          {
            name: 'options',
            kind: 'options',
            options: [
              LABEL,
              {
                name: 'default',
                description: 'Whether it starts on.',
                values: [true, false],
              },
            ],
          },
        ],
        returns: 'control',
      },
    ],
  },
  {
    name: 'select',
    kind: 'select',
    accepts: ['choice'],
    signature: 'select(target, param, options?)',
    description:
      "Declares a menu for a parameter that takes one of a list of values: select('#osc', 'shape'). " +
      TARGET,
    signatures: [
      {
        args: [
          TARGET_ARG,
          {
            name: 'param',
            kind: 'param',
            of: 'target',
            description: 'A parameter that takes one of a list of values.',
          },
          {
            name: 'options',
            kind: 'options',
            optional: true,
            options: [LABEL],
          },
        ],
        returns: 'control',
      },
    ],
  },
  {
    name: 'stepGrid',
    kind: 'stepGrid',
    accepts: [],
    signature: 'stepGrid(name, options?)',
    description:
      "Declares a step grid for a named sequence of this script: stepGrid('steps'). Put it after the " +
      "__.transport.sequence('steps', …) call. The steps written in that call are the default; a pattern edited " +
      'in the grid is stored in the project and applied here when the script runs. A sequence has a grid only if a stepGrid() line, or controls(), declares one. ' +
      'Returns the control: .value is the steps, .set(steps) changes grid and sequence together. Options: label, view.',
    signatures: [
      {
        args: [
          {
            name: 'name',
            kind: 'sequence',
            description: 'A named sequence of this script.',
          },
          {
            name: 'options',
            kind: 'options',
            optional: true,
            options: [
              LABEL,
              {
                name: 'view',
                description: 'How its steps are drawn.',
                values: ['toggles'],
                default: "'toggles'",
              },
            ],
          },
        ],
        returns: 'control',
      },
    ],
  },
  {
    name: 'controls',
    kind: null,
    accepts: ['number', 'boolean', 'choice'],
    signature: 'controls() | controls(target, names?)',
    description:
      'With nothing, declares all the UI of what the script makes, in one line: a control for every parameter of every node it has made so far (the inserts of its buses too), a section per node; ' +
      'a waveform editor for every sampler among them; and a step grid for every named sequence of the script, wherever in the script the sequence is. Put controls() after the chain. ' +
      'A slider(), knob(), toggle(), select(), stepGrid() or waveform() of your own for the same thing, before or after, is used instead of the one from controls(). ' +
      "With a target, only the parameters of those nodes (no grids, no waveform): controls('#kick'), controls(kick) for every node of a chain, controls(__.bus('drums').compressor(…)) for the inserts that adds to a bus, controls(__.bus('drums')) for the bus's level. " +
      "With a list, only the parameters named: controls('#kick', ['speed', 'start']). " +
      'Each parameter gets the kind that suits it.',
    signatures: [
      {
        description:
          'All the UI of what the script makes: controls for every node made so far, a waveform for every sampler, a step grid for every named sequence.',
        args: [],
        returns: 'controls',
      },
      {
        args: [
          TARGET_ARG,
          {
            name: 'names',
            kind: 'list',
            optional: true,
            items: { kind: 'param', of: 'target' },
            description: 'Only these parameters.',
          },
        ],
        returns: 'controls',
      },
    ],
  },
  {
    name: 'waveform',
    kind: 'waveform',
    accepts: [],
    signature: 'waveform(target, options?)',
    description:
      "Declares a waveform editor for a sampler, shown in the track's source pane: waveform('#sampler'). " +
      'It draws the sound the sampler plays and edits its start, end, loop points, loop and reverse, its slices, and which sound it is. ' +
      'Those are ordinary controls: a slider() for the same parameter shows the same value, and what is set is stored in the project and applied here when the script runs. ' +
      'The numbers in the sampler are the defaults. Slices belong to the sound, so every track that plays it shares them. ' +
      'The target can be a selector, a chain, a selection or a node; several samplers get an editor each.',
    signatures: [
      {
        args: [
          {
            ...TARGET_ARG,
            description:
              "The sampler: a selector ('#sampler'), or a chain, a selection or a node.",
          },
          {
            name: 'options',
            kind: 'options',
            optional: true,
            options: [LABEL],
          },
        ],
      },
    ],
  },
];

/** What a declared control gives back to the script, for the editor's completion after a dot. */
export const CONTROL_MEMBERS: readonly {
  name: string;
  signature?: string;
  description: string;
}[] = [
  {
    name: 'value',
    description:
      'The control’s value now: what the project holds, else the parameter’s own (or the declared default). Read it any time, in a callback too.',
  },
  {
    name: 'set',
    signature: 'set(value)',
    description:
      'Moves the control and its parameter together, as if the person had. In a sequence callback it lands on the step.',
  },
];

/** The widget `controls()` picks for a parameter of each kind. */
export const KIND_FOR_PARAM: Readonly<
  Record<'number' | 'boolean' | 'choice', string>
> = {
  number: 'slider',
  boolean: 'toggle',
  choice: 'select',
};
