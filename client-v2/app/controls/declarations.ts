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
  options: ControlOptions;
  /** made by `controls('#node')` with no list: shown under "more" */
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
  'Options: label, mode ("linear", "exponential", "note", "decibels", "stepped"), min, max, step, values.';

export const CONTROL_FUNCTIONS: readonly ControlFunction[] = [
  {
    name: 'slider',
    kind: 'slider',
    accepts: ['number'],
    signature:
      'slider(selector, param, options?) | slider(name, { min, max, default })',
    description:
      "Declares a slider for a parameter of the nodes the selector finds: slider('#filter', 'frequency'). " +
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
      'knob(selector, param, options?) | knob(name, { min, max, default })',
    description:
      "Declares a knob: the same as slider(), drawn as a dial. knob('#level', 'gain', { label: 'Level' }). " +
      OPTIONS,
  },
  {
    name: 'toggle',
    kind: 'toggle',
    accepts: ['boolean'],
    signature: 'toggle(selector, param, options?) | toggle(name, { default })',
    description:
      "Declares an on/off switch for a true-or-false parameter: toggle('#sampler', 'loop'). " +
      "With a name and an object, a switch of its own: const fills = toggle('fills', { default: false }).",
  },
  {
    name: 'select',
    kind: 'select',
    accepts: ['choice'],
    signature: 'select(selector, param, options?)',
    description:
      "Declares a menu for a parameter that takes one of a list of values: select('#osc', 'shape').",
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
    signature: 'controls(selector, names?)',
    description:
      "Declares a control for every parameter of the node, of the kind that suits each: controls('#kick'). " +
      "They are listed under \"more\". With a list, only those named, shown with the rest: controls('#kick', ['speed', 'start']).",
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
