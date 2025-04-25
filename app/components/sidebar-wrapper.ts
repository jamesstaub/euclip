import Component from '@glimmer/component';
import { service } from '@ember/service';
import MediaService from 'ember-responsive';


export default class SidebarWrapperComponent extends Component {

  @service declare media: MediaService;

  get responsiveClass() {
    if (this.media.isMobile) {
      return 'absolute top-0 w-100 max-w-100';
    }
    if (this.media.isTablet) {
      return 'absolute top-0 w-100 max-w-100 h-100';
    }

    return 'w6 h-auto';
    
  }

}