import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
export default class UserCreatorProjectTrackRoute extends Route {
  @service store;
  @service router;

  async model(params) {
    const slug = this.modelFor('user.creator.project').slug;
    let model;
    if (slug) {
      try {
        model = await this.store.findRecord('track', params.track_id, {
          adapterOptions: { slug },
        });
      } catch (error) {
        this.exitTrack();
      }
    }
    return model;
  }

  afterModel(model) {
    if (model) {
      model.on('didDelete', () => {
        this.exitTrack();
      });
    }
  }

  exitTrack() {
    this.router.transitionTo('user.creator.project.index');
  }

  setupController(controller, model) {
    super.setupController(controller, model);
    controller.project.activeTrack = model;
  }
}
