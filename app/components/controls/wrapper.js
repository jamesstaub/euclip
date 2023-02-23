import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { isPresent } from '@ember/utils';

export default class ControlsWrapperComponent extends Component {
  @tracked isShowingConfig = false;

  @action
  toggleInterface() {
    // TODO: refactor this to support different control types
    const val = this.args.trackControl.isMultislider;
    const interfaceName = ['slider', 'multislider'][Number(!val)];
    this.args.trackControl.set('interfaceName', interfaceName);
    this.args.trackControl.save();
  }

  @action
  toggleConfig() {
    this.isShowingConfig = !this.isShowingConfig;
  }
}
