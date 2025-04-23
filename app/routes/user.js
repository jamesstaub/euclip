import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class UserRoute extends Route {
  @service session;
  @service currentUser;
  @service router

  beforeModel() {
    console.log('user route BM');

    // TODO: if !authenticated
    // rename /embed to /oauth or discord route then send them back here once logged in
    if (window.isEmbed) {
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
