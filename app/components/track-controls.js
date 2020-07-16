import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class TrackControlsComponent extends Component {
  
  @action
  scrollToPageOffset(page, element) {
    const sliderWidth = 32.2; // TODO move this to shared config with NexusMultislider
    const pageSize = 16; // ditto
    element.scrollTo({
      left: sliderWidth * page * pageSize,
      behavior: 'smooth'
    });
  }
}
