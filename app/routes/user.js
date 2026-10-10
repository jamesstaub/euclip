import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class UserRoute extends Route {
  @service session;
  @service currentUser;
  @service router;

  beforeModel() {
    return this._loadCurrentUser();
  }

  afterModel() {
    if (!this.session.isAuthenticated) {
      this.router.transitionTo('login');
    }
  }

  async _loadCurrentUser() {
    try {
      return await this.currentUser.load();
    } catch (err) {
      console.error('Error Loading current user', err);
      this.session.invalidate();
    }
  }
}
