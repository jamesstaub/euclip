import Component from "@glimmer/component";
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { htmlSafe } from '@ember/template';

const SINGLE_SLIDER_WIDTH = 32.2;

export default class TrackControlWrapperComponent extends Component {
  @tracked showConfig

  get isConfigurable() {
    return !(this.args.hideConfig || this.args.trackControl?.interfaceName === 'number');
  }

  get multisliderWidth() {
    return SINGLE_SLIDER_WIDTH * this.args.trackControl?.controlArrayComputed?.length || 0;
  }

  get wrapperStyle() {
    if (this.args.trackControl?.isMultislider) {
      return htmlSafe(`width: ${this.multisliderWidth + SINGLE_SLIDER_WIDTH}px`);
    } else {
      return null;
    }
  }

  @action
  toggleConfig() {
    this.showConfig = !this.showConfig;    
  }

  @action
  setValue(value) {
    this.args.trackControl.setValue(value);
    this.args.trackControl.saveTrackControl.perform();
  }

  @action
  changeUiType({value}) {
    this.args.trackControl.set('interfaceName', value);
    this.args.trackControl.saveTrackControl.perform();
  }

  @action
  setParam(key, value) {
    if (value.value) {
      value = value.value; // dropdown menu's value is an object
    }
    this.args.trackControl.set(key, value);
    this.args.trackControl.saveTrackControl.perform();
  }

  @action
  setDefault() {
    this.args.trackControl.setDefault();
  }
}
