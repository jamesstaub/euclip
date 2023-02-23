import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class ControlsControlConfigComponent extends Component {
  @action
  setControlProperty(key, val) {
    if (this.args.trackControl.get(key) === val) return;

    this.args.trackControl.set(key, val);
    this.args.trackControl.beforeUpdateValue();
    this.args.trackControl.setMinMaxByDefault();
    this.args.trackControl.saveTrackControl.perform();
  }
}
