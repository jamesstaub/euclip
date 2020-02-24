import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';

export default class TrackContainerComponent extends Component {
  @service router

  @action
  async deleteTrack() {
    const projectTracks = this.args.track.get('project.tracks');
    await this.args.track.destroyAndCleanup();
    this.router.transitionTo('user.creator.project.track', projectTracks.firstObject);
  }

  @action
  updateTrackSequence(idx) {
    //if sequence is different than euclidean output 
    // manually override sequence
    console.log(idx);
    
    // TODO throttle save with task?
    // this.args.track.save();
  }
  
  @action
  toggleDrumFilePicker() {
    this.args.track.drumMenuOpen = !this.args.track.drumMenuOpen;
  }
}
