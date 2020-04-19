import Component from "@glimmer/component";
import { action } from '@ember/object';

export default class TrackControlWrapperComponent extends Component {
  showMinMax() {
    !!(this.slider || this.multislider);
  }

  @action
  onChangeValue(v) {
    this.args.updateControl(v);
  }
  
  @action
  changeUiType({value}) {
    this.args.trackControl.set('interfaceName', value);
    this.args.trackControl.save();
  }

}
