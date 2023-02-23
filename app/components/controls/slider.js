import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class ControlsSliderComponent extends Component {
  @tracked numberElement;

  @action
  onChangeSlider(value) {
    this.args.onChange(value);
  }
}
