import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class ControlsSliderConfigComponent extends Component {
  @action
  toggleInterface(val) {
    console.log('setInterfaceName', val);
    const interfaceName = ['slider', 'multislider'][Number(val)];
    this.args.trackControl.set('interfaceName', interfaceName);
    this.args.trackControl.save();
  }
}
