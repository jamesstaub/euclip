import Component from "@glimmer/component";
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class TrackControlWrapperComponent extends Component {
  @tracked controlArrayValue
  // REFACTOR
  // this should be doable with @tracked instead but there was an error about there not being a setter defined 
  // and an es5 setter for controlArrayValue was throwing babel errors :(
  get controlArrayValue() {
    // fill the trackControl model's array with defaul value if it is not the correct length
    console.log(this.args.controlArrayValue);
    while (
      this.args.controlArrayValue.length < this.args.sequence.length
    ) {
      this.args.controlArrayValue.push(
        this.args.trackControl.defaultValue
      );
    }
    return this.args.controlArrayValue;
  }

  @action
  onChangeValue(v) {
    this.args.updateControl(v);
  }

}
