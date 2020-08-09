import Component from "@glimmer/component";
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { htmlSafe } from '@ember/template';

const MULTISLIDER_WIDTH = 32.2;

export default class TrackControlWrapperComponent extends Component {
  @tracked showConfig

  get isConfigurable() {
    return !(this.args.hideConfig || this.args.trackControl?.interfaceName === 'number');
  }

  get multisliderWidth() {
    return MULTISLIDER_WIDTH * this.args.trackControl?.controlArrayComputed?.length || 0;
  }

  get multisliderWidthStyle() {
    if (this.args.trackControl?.isMultislider) {
      // TODO make 16 dynamic for responsive screen changes in sliders per page 
      const width = Math.min(this.multisliderWidth, MULTISLIDER_WIDTH * 16);
      return htmlSafe(`width: ${width}px`);
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
