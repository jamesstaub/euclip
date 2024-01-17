import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';

export default class ControlsWrapperComponent extends Component {
  @tracked isShowingConfig = false;
  @service notifications;

  @action
  toggleInterface() {
    const val = this.args.trackControl.isMultislider;
    const interfaceName = [
      this.args.trackControl.defaultInterfaceName,
      'multislider',
    ][Number(!val)];
    this.args.trackControl.set('interfaceName', interfaceName);
    try {
      this.args.trackControl.save();
    } catch (error) {
      console.error('TOGG', error);
      this.notifications.push({
        message: 'Error saving track control',
        type: 'error',
      });
    }
  }

  @action
  toggleConfig() {
    this.isShowingConfig = !this.isShowingConfig;
  }

  @action
  setParamUnit({ index, value }) {
    this.args.trackControl.setParamUnit({ index, value });
  }
}
