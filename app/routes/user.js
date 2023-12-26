import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class UserRoute extends Route {
  @service session;
  @service currentUser;

  beforeModel() {
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
