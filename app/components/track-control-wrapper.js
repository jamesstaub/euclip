import Component from "@glimmer/component";
import { action, computed } from '@ember/object';

export default class TrackControlWrapperComponent extends Component {

  @action
  onChangeValue(v) {
    this.args.updateControl(v);
  }

}
