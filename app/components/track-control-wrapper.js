import Component from "@glimmer/component";
import { action, computed } from '@ember/object';

export default class TrackControlWrapperComponent extends Component {

  // REFACTOR
  // this should be doable with @tracked instead but there was an error about there not being a setter defined 
  // and an es5 setter for controlArrayValue was throwing babel errors :(
  // get values() {
  //   // fill the trackControl model's array with defaul value if it is not the correct length
  //   while (
  //     this.args.controlArrayValue.length < this.args.sequence.length
  //   ) {
  //     this.args.controlArrayValue.push(
  //       this.args.trackControl.defaultValue
  //     );
  //   }
  //   const a = this.args.controlArrayValue.slice(0, this.args.sequence.length);
  //   console.log(a);
    
  //   return a;
  // }

  @action
  onChangeValue(v) {
    this.args.updateControl(v);
  }

}
