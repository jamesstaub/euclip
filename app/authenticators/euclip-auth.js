import { inject as service } from '@ember/service';
import DeviseAuthenticator from 'ember-simple-auth/authenticators/devise';
import ENV from '../config/environment';
import { isEmpty } from '@ember/utils';

export default DeviseAuthenticator.extend({
  store: service(),
  session: service(),

  serverTokenEndpoint: `${ENV.APP.userEndpoint}`,

  restore(data) {
    if (this.session.currentUser) {
      Promise.resolve();
    } else {
      // should be a GET to session endpoint
      // return this.authenticate();
    }
  },

  invalidate(data) {
    this.session.set('currentUser', null);
  },

  // overriding the defaul devise _validate, which requires token be in the response data. seemingly no need for that
  // also format resourcename (email) per JSONAPI specs
  _validate(data) {
    const identificationAttributeName = this.identificationAttributeName;
    const resourceName = this.resourceName;
    const _data = data[resourceName] ? data[resourceName] : data;
  
    return !isEmpty(_data.data.attributes[identificationAttributeName]);
  }
});
