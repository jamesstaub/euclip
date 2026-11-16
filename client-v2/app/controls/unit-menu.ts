/**
 * The unit choices of a number control as menu items: the same list wherever the control is shown (its
 * row in the controls pane, a sampler's speed in the waveform editor). One control, one stored choice.
 */
import type { ControlView } from 'client-v2/audio/runner';
import type { MenuItem } from 'client-v2/components/ui/popup-menu';

/** "Single value" and "Per step: name" for a slider or knob: how many values it holds. */
export function stepMenuItems(
  control: ControlView,
  choose: (choice: string) => void,
): MenuItem[] {
  return control.stepChoices.length > 1
    ? control.stepChoices.map((choice, index) => ({
        label: choice.label,
        checked: choice.id === control.stepChoice,
        separated: index === 0,
        onSelect: () => choose(choice.id),
      }))
    : [];
}

export function unitMenuItems(
  control: ControlView,
  choose: (choice: string) => void,
): MenuItem[] {
  // (a parameter with only one unit has nothing to choose)
  return control.choices.length > 1
    ? control.choices.map((choice) => ({
        label: choice.label,
        checked: choice.id === control.choice,
        onSelect: () => choose(choice.id),
      }))
    : [];
}
