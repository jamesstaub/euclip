/** Small pure helpers over what the runner says about a control, shared by the widgets. */
import type { ControlView } from 'client-v2/audio/runner';
import { mapping, type Mapping } from 'client-v2/controls/modes';

/** How a number control's travel maps to values, in the mode it is in. Null for a control that is not a number. */
export function mappingOf(control: ControlView): Mapping | null {
  return control.meta.kind === 'number'
    ? mapping(control.mode, control.meta)
    : null;
}

export function numberOf(value: unknown): number {
  return typeof value === 'number' ? value : 0;
}
