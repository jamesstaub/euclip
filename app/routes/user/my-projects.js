import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import ENV from 'euclip/config/environment';

export default class UserMyProjectsRoute extends Route {
  @service session
  @service currentUser
  model() {
    if (this.session.isAuthenticated) {
      // TODO separate endpoint for user's projects
      // and all public projects
      return this.store.findAll('project', { 
        adapterOptions: {
          userId: this.currentUser.user.id
        },
        include: ENV.APP.projectIncludeParams
      });
    }
  }
}
