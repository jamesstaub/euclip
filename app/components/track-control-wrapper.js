import Component from "@glimmer/component";
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class TrackControlWrapperComponent extends Component {
  @tracked showConfig

  get isConfigurable() {
    return !(this.args.hideConfig || this.args.trackControl?.interfaceName === 'number');
  }

  @action
  toggleConfig() {
    this.showConfig = !this.showConfig;    
  }

  @action
  setValue(value) {
    this.args.trackControl.setValue(value);
    this.args.saveTrackControl.perform(this.args.trackControl);
  }

  @action
  changeUiType({value}) {
    this.args.trackControl.set('interfaceName', value);
    this.args.saveTrackControl.perform(this.args.trackControl);
  }

  @action
  setParam(key, value) {
    if (value.value) {
      value = value.value; // dropdown menu's value is an object
    }
    this.args.trackControl.set(key, value);
    this.args.saveTrackControl.perform(this.args.trackControl);
  }

  @action
  setDefault() {
    this.args.trackControl.setDefault();
  }
}
