import Route from '@ember/routing/route';
import { service } from '@ember/service';
import ProjectAdapter from '../../adapters/project';

export default class UserMyProjectsRoute extends Route {
  @service session;
  @service store;
  @service currentUser;
  @service router;

  model() {
    if (this.session.isAuthenticated) {
      // TODO separate endpoint for user's projects
      // and all public projects
      return this.store.findAll('project', {
        adapterOptions: {
          userId: this.currentUser.user.id,
        },
        include: ProjectAdapter.projectIncludeParams,
      });
    } else {
      // TODO: figure out why we are hitting this when loading from /embed route
      // this.router.transitionTo('login');
      console.log('not authenticated');
    }
  }

  afterModel(model) {
    if (this.session.isAuthenticated && !model.length) {
      this.router.transitionTo('user.new');
    }
  }
}
