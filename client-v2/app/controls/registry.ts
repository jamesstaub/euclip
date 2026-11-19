/**
 * The widget registry: every kind of control there is, one entry each.
 *
 * A kind is three things that go together:
 *   - the script function that declares it (controls/declarations.ts and script-api.ts: plain data,
 *     nothing of the app, so it can run in the sandbox),
 *   - what it binds to: the parameters, values or sequences its declaration names,
 *   - the component that draws it, here.
 *
 * The store and the panes know nothing about particular kinds. The store keeps one entry per
 * declaration key, whatever its value is; a pane asks this registry for the component of each
 * declaration's kind. So a compound kind (a waveform editor over three parameters and a buffer, an XY
 * pad over two parameters) is one more entry here, one more script function, and nothing else: its
 * declaration lists several bindings and its component is given them.
 */
import type { ComponentLike } from '@glint/template';
import KnobWidget from 'client-v2/components/widgets/knob-widget';
import SelectWidget from 'client-v2/components/widgets/select-widget';
import StepGridWidget, {
  type StepGridWidgetSignature,
} from 'client-v2/components/widgets/step-grid-widget';
import SliderWidget, {
  type ControlWidgetSignature,
} from 'client-v2/components/widgets/slider-widget';
import ToggleWidget from 'client-v2/components/widgets/toggle-widget';
import type { SynthView, WaveformView } from 'client-v2/audio/runner';
import type { Binding } from 'client-v2/controls/declarations';

interface Entry<S> {
  /** the kind a declaration names */
  kind: string;
  /** what its declaration binds to */
  binds: readonly Binding['type'][];
  /**
   * `row`: drawn in a row with its label, a readout to type into, and the control menu.
   * `block`: drawn on its own, full width (a grid, later an editor).
   */
  layout: 'row' | 'block';
  /** number kinds have slider modes and a typed value */
  number: boolean;
  component: ComponentLike<S>;
}

export type ControlEntry = Entry<ControlWidgetSignature>;
export type StepGridEntry = Entry<StepGridWidgetSignature>;

const CONTROLS: readonly ControlEntry[] = [
  {
    kind: 'slider',
    binds: ['param', 'value'],
    layout: 'row',
    number: true,
    component: SliderWidget,
  },
  {
    kind: 'knob',
    binds: ['param', 'value'],
    layout: 'row',
    number: true,
    component: KnobWidget,
  },
  {
    kind: 'toggle',
    binds: ['param', 'value'],
    layout: 'row',
    number: false,
    component: ToggleWidget,
  },
  {
    kind: 'select',
    binds: ['param'],
    layout: 'row',
    number: false,
    component: SelectWidget,
  },
];

const STEP_GRIDS: readonly StepGridEntry[] = [
  // (a step grid's `view` option will choose among entries like this one; 'toggles' is the only view yet)
  {
    kind: 'stepGrid',
    binds: ['sequence'],
    layout: 'block',
    number: false,
    component: StepGridWidget,
  },
];

/**
 * A compound kind: one widget over several bindings (a waveform editor over a sampler's start, end,
 * loop points, loop, reverse and speed, and the sound it plays). Its declaration lists the bindings; the
 * parts that are parameters are ordinary declared controls, which the runner hands to the widget
 * together (see `ProjectRunner#waveforms`). The component is loaded when a pane first shows one, so its
 * code is not part of the app until it is wanted.
 */
export interface CompoundEntry<S> {
  kind: string;
  binds: readonly Binding['type'][];
  layout: 'block';
  /** which footer pane shows it */
  pane: 'source';
  load: () => Promise<ComponentLike<S>>;
}

const COMPOUNDS: readonly CompoundEntry<WaveformWidgetSignature>[] = [
  {
    kind: 'waveform',
    binds: ['param', 'option'],
    layout: 'block',
    pane: 'source',
    load: () =>
      import('client-v2/waveform/editor').then((module) => module.default),
  },
];

/** What the waveform widget is given. (Its own module is only a type here, so it stays out of the app's first load.) */
export interface WaveformWidgetSignature {
  Element: HTMLElement;
  Args: {
    scopeId: string;
    waveform: WaveformView;
    /** every waveform of the script, when there are several to choose between */
    others?: readonly { key: string; label: string }[];
    onChoose?: (key: string) => void;
  };
}

/** What the synth widget is given. */
export interface SynthWidgetSignature {
  Element: HTMLElement;
  Args: {
    scopeId: string;
    synth: SynthView;
    /** every source editor of the script, when there are several to choose between */
    others?: readonly { key: string; label: string }[];
    onChoose?: (key: string) => void;
  };
}

const SYNTH: CompoundEntry<SynthWidgetSignature> = {
  kind: 'synth',
  binds: ['param'],
  layout: 'block',
  pane: 'source',
  load: () =>
    import('client-v2/components/synth-editor').then(
      (module) => module.default,
    ),
};

/** The entry that draws a synth editor: an oscillator's or a synth macro's source tab. */
export function synthWidget(): CompoundEntry<SynthWidgetSignature> {
  return SYNTH;
}

/** The entry that draws a waveform editor. */
export function waveformWidget(): CompoundEntry<WaveformWidgetSignature> {
  return COMPOUNDS[0]!;
}

/** The entry for a control bound to a value: slider, knob, toggle, select. */
export function controlWidget(kind: string): ControlEntry | undefined {
  return CONTROLS.find((entry) => entry.kind === kind);
}

/** The entry that draws a grid. */
export function stepGridWidget(): StepGridEntry {
  return STEP_GRIDS[0]!;
}

/** Every kind there is, for anything that lists them. */
export const WIDGET_KINDS: readonly string[] = [
  ...CONTROLS,
  ...STEP_GRIDS,
  ...COMPOUNDS,
  SYNTH,
].map((entry) => entry.kind);
