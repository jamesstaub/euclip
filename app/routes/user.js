import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class UserRoute extends Route {
  @service session;
  @service currentUser;
  @service router

  beforeModel() {
       
    // rename /embed to /oauth or discord route then send them back here once logged in
    if (window.isEmbed && !this.session.isAuthenticated) {
      return this.router.transitionTo('embed');
    }

    return this._loadCurrentUser();
  }

  async _loadCurrentUser() {
    try {
      return this.currentUser.load();
    } catch (err) {
      console.error('Error Loading current user', err);
      this.session.invalidate();
    }
  }
}
