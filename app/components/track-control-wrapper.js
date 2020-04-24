import Component from "@glimmer/component";
import { action } from '@ember/object';

export default class TrackControlWrapperComponent extends Component {
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
