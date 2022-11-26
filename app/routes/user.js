import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import ENV from '../config/environment';

export default class UserRoute extends Route {
  @service session;
  @service currentUser;

  beforeModel() {
    // FIME this request is blocking if there is no network connection
    try {
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
      this.session.invalidate();
      this.transitionTo('login');
    }
  }
}
