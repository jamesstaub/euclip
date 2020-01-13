import Component from '@glimmer/component';
import { action } from '@ember/object';
export default class CurrentTrackFooterComponent extends Component {
  
  @action
  updateControl(trackControl, value) {
    trackControl.setValue(value)
    // TODO save
  }
}
