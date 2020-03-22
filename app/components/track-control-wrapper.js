import Component from "@glimmer/component";
import { action } from '@ember/object';

export default class TrackControlWrapperComponent extends Component {
  get multisliderData() {
    // fill the trackControl model's array with defaul value if it is not the correct length
    while (
      this.args.trackControl.multisliderData.length < this.args.sequence.length
    ) {
      this.args.trackControl.multisliderData.push(
        this.args.trackControl.defaultValue
      );
    }
    return this.args.trackControl.multisliderData;
  }

  set multisliderData() {
    console.log('set!@');
  }

  @action
  onChangeValue(v) {
    debugger
    // this.updateControl(v);
  }

}
