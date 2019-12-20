import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
export default class UserMyProjectsRoute extends Route {
  @service session
  model() {
    // return this.session.currentUser.projects;
  }
}
