import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class UserRoute extends Route {
  @service session;
  @service currentUser;

  beforeModel() {
    try {
      // FIXME this request is blocking if there is no network connection
      // fetch(ENV.APP.DRUMSERVER_HOST); // fire a ping to wakeup free heroku server
    } catch (error) {
      console.log(error);
    }
    return this._loadCurrentUser();
  }

  async _loadCurrentUser() {
    try {
      await this.currentUser.load();
    } catch (err) {
      console.error('Error Loading current user', err);
      this.session.invalidate();
    }
  }
}
