import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class UserRoute extends Route {
  @service session
  async beforeModel() {
    if (this.session.isAuthenticated) {
      this.transitionTo('user.my-projects');
    }
  }
}
