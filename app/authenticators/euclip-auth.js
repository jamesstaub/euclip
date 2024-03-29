import { inject as service } from '@ember/service';
import Devise from 'ember-simple-auth/authenticators/devise';

import ENV from '../config/environment';

export default class DeviseAuthenticator extends Devise {
  @service store;
  @service session;
  @service currentUser;
  @service router;

  serverTokenEndpoint = `${ENV.APP.userEndpoint}`;
  invalidateEndpoint = `${ENV.APP.invalidateEndpoint}`;

  identificationAttributeName = 'login';

  async invalidate() {
    if (this.session.isAuthenticated) {
      let headers = {};
      headers[
        'Authorization'
      ] = `Bearer ${this.session.data.authenticated.token}`;
      const response = await fetch(this.invalidateEndpoint, {
        method: 'DELETE',
        headers: headers,
      });
      if (response.status !== 200) {
        console.error('Problem invalidating server session');
      } else {
        this.router.transitionTo('login');
      }
    }
  }
}
