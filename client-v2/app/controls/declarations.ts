/**
 * What a script's control declarations are, as plain data.
 *
 * `slider('#filter', 'frequency')` in a script produces a `Declaration`. It is plain JSON on purpose:
 * when scripts run in a sandbox it is what crosses to the page, and it is what the widget registry
 * (controls/registry.ts) turns into something on screen. Nothing here touches the DOM or the app.
 */
import type { StoredValue } from 'client-v2/project/schema';

/** What a widget is bound to. A kind may use several (a waveform editor: three parameters and a buffer). */
export type Binding =
  /** a parameter of the nodes a selector finds */
  | { type: 'param'; selector: string; param: string }
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
  /** a sequencer: how its steps are drawn. Only 'toggles' (the default) exists so far. */
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
  /** the line of the script it was declared on, counted from 1, when that could be told */
  line?: number;
}

/** Something wrong with one declaration. The rest of the script runs. */
export interface DeclarationWarning {
  message: string;
  line?: number;
  /** a sequencer was declared for a sequence that did not exist at that point: its name */
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

/** Which kinds of parameter each script function accepts, and how the editor documents it. */
export interface ControlFunction {
  name: string;
  /** the widget it declares; `controls` chooses per parameter */
  kind: string | null;
  /** the kinds of parameter it can show; empty for a function that is not bound to a parameter */
  accepts: readonly ('number' | 'boolean' | 'choice')[];
  signature: string;
  description: string;
}

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
  },
  {
    name: 'select',
    kind: 'select',
    accepts: ['choice'],
    signature: 'select(target, param, options?)',
    description:
      "Declares a menu for a parameter that takes one of a list of values: select('#osc', 'shape'). " +
      TARGET,
  },
  {
    name: 'sequencer',
    kind: 'sequencer',
    accepts: [],
    signature: 'sequencer(name, options?)',
    description:
      "Declares a step grid for a named sequence of this script: sequencer('steps'). Put it after the " +
      "__.transport.sequence('steps', …) call. The steps written in that call are the default; a pattern edited " +
      'in the grid is stored in the project and applied here when the script runs. A sequence with no sequencer() has no grid. ' +
      'Returns the control: .value is the steps, .set(steps) changes grid and sequence together. Options: label, view.',
  },
  {
    name: 'controls',
    kind: null,
    accepts: ['number', 'boolean', 'choice'],
    signature: 'controls() | controls(target, names?)',
    description:
      'With nothing, declares a control for every parameter of every node the script has made so far (the inserts of its buses too), a section per node: put controls() after the chain. ' +
      "With a target, for those nodes: controls('#kick'), controls(kick) for every node of a chain, controls(__.bus('drums').compressor(…)) for the inserts that adds to a bus, controls(__.bus('drums')) for the bus's level. " +
      "With a list, only the parameters named: controls('#kick', ['speed', 'start']). " +
      'Each parameter gets the kind that suits it. A slider(), knob(), toggle() or select() for the same node and parameter is used instead of the one from controls().',
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
