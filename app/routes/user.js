import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import ENV from '../config/environment';

export default class UserRoute extends Route {
  @service session;
  @service currentUser;

  beforeModel() {
    fetch(ENV.APP.DRUMSERVER_HOST); // fire a ping to wakeup free heroku server
    return this._loadCurrentUser();
  }

  async _loadCurrentUser() {
    try {
      await this.currentUser.load();
    } catch(err) {
      this.session.invalidate();
      this.transitionTo('login');
    }
  }
}

