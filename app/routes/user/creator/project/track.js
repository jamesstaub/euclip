import Route from '@ember/routing/route';

export default class UserCreatorProjectTrackRoute extends Route {
  model(params) {
    const slug = this.modelFor('user.creator.project').slug;
    let model;
    if (slug) {
      model = this.store.findRecord('track', params.track_id, {adapterOptions: { slug } });
    }
    return model || this.transitionTo('user.creator.project');
  }

  setupController(controller, model) {
    this.controllerFor('user.creator.project').set('activeTrack', model);
  }
}
