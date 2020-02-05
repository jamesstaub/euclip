import Route from '@ember/routing/route';

export default class UserCreatorProjectTrackRoute extends Route {

  setupController(controller, model) {
    this.controllerFor('user.creator.project').set('activeTrack', model);
  }

}
