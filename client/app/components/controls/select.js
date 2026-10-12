import Component from '@glimmer/component';
import { action } from '@ember/object';

/**
 * A control that picks one of a few named options (a macro's waveform, say). The control stores the
 * option's index; the macro receives the option's name.
 */
export default class ControlsSelectComponent extends Component {
  get selected() {
    const choices = this.args.trackControl.choices;
    return choices[Math.round(this.args.trackControl.controlValue)] ?? choices[0];
  }

  @action
  onChange({ index }) {
    this.args.onChange(index);
  }
}
