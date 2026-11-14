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
import SequencerWidget, {
  type SequencerWidgetSignature,
} from 'client-v2/components/widgets/sequencer-widget';
import SliderWidget, {
  type ControlWidgetSignature,
} from 'client-v2/components/widgets/slider-widget';
import ToggleWidget from 'client-v2/components/widgets/toggle-widget';
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
export type SequencerEntry = Entry<SequencerWidgetSignature>;

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

const SEQUENCERS: readonly SequencerEntry[] = [
  // (a sequencer's `view` option will choose among entries like this one; 'toggles' is the only view yet)
  {
    kind: 'sequencer',
    binds: ['sequence'],
    layout: 'block',
    number: false,
    component: SequencerWidget,
  },
];

/** The entry for a control bound to a value: slider, knob, toggle, select. */
export function controlWidget(kind: string): ControlEntry | undefined {
  return CONTROLS.find((entry) => entry.kind === kind);
}

/** The entry that draws a sequencer. */
export function sequencerWidget(): SequencerEntry {
  return SEQUENCERS[0]!;
}

/** Every kind there is, for anything that lists them. */
export const WIDGET_KINDS: readonly string[] = [...CONTROLS, ...SEQUENCERS].map(
  (entry) => entry.kind,
);
