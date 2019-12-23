import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
export default class UserMyProjectsRoute extends Route {
  @service session
  model() {
    if (this.session.isAuthenticated) {
      // TODO separate endpoint for user's projects
      // and all public projects
      return this.store.findAll('project', { 
        adapterOptions: {
          userId: this.session.currentUser.id
        },
        include: 'creator,tracks,tracks.init-script,tracks.onstep-script'
      });
    }
  }
}
