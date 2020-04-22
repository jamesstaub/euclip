import Route from '@ember/routing/route';

export default class UserCreatorProjectTrackRoute extends Route {

  async model(params) {
    const slug = this.modelFor('user.creator.project').slug;
    let model;
    if (slug) {
      try {
        model = await this.store.findRecord('track', params.track_id, {adapterOptions: { slug } });
      } catch (error) {
        this.exitTrack();
      }
    }
    return model;
  }

  afterModel(model) {
    if (model) {
      model.on('didDelete', () => {
        // TODO track nodes and controls should be deleted in the API on delete, however they should also get removed from the store
        // maybe possible with .reload()? otherwise loop over and remove
        this.exitTrack();
      });
    }
  }
  
  exitTrack() {    
    this.transitionTo('user.creator.project.index');
  }

  setupController(controller, model) {
    super.setupController(controller, model);
    this.controllerFor('user.creator.project').set('activeTrack', model);
  }
}
