import Route from '@ember/routing/route';

export default class UserCreatorProjectTrackRoute extends Route {
  model(params) {
    // TODO fix adapterOptions to support landing on a track ID route
    // const model = this.store.findRecord('track', params.track_id, {adapterOptions: params.parent.name });
    // return model || this.transitionTo('user.creator.project');
    this.transitionTo('user.creator.project');
  }

  setupController(controller, model) {
    this.controllerFor('user.creator.project').set('activeTrack', model);
  }
}
