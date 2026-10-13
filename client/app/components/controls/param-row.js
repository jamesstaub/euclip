import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';

/**
 * One parameter of a track node, on one line: [per-step toggle] name, the control (slider and value, choice or switch),
 * its unit, and a small menu with everything that is about the parameter rather than its value (range, step, default,
 * "apply on hits only", reset). Resetting every parameter of the node is on the node (see NodeControls).
 */
export default class ControlsParamRowComponent extends Component {
  @service notifications;

  // A unit that is the only choice and says nothing is not shown: a switch is "Boolean", a choice is "Choice".
  // (A single informative unit, like Hz or Seconds, is shown as a label; several units make a small select.)
  get singleUnit() {
    const control = this.args.trackControl;
    const names = control.paramUnitNames;
    if (names.length !== 1 || control.isToggle || control.isSelect) return undefined;
    return ['Boolean', 'Choice'].includes(names[0]) ? undefined : names[0];
  }

  get hasUnitChoice() {
    return this.args.trackControl.paramUnitNames.length > 1;
  }

  @action
  toggleInterface() {
    const control = this.args.trackControl;
    const interfaceName = [control.defaultInterfaceName, 'multislider'][Number(!control.isMultislider)];
    control.set('interfaceName', interfaceName);
    try {
      control.saveTrackControl.perform();
    } catch (error) {
      console.error('TOGG', error);
      this.notifications.push({ message: 'Error saving track control', type: 'error' });
    }
  }

  @action
  setParamUnit({ index, value }) {
    this.args.trackControl.setParamUnit({ index, value });
  }

  @action
  resetControl(dropdown) {
    this.args.trackControl.resetToDefault();
    dropdown?.actions.close();
  }
}
