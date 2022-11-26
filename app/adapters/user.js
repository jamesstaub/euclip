import JSONAPIAdapter from '@ember-data/adapter/json-api';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import ENV from 'euclip/config/environment';

export default class ApplicationAdapter extends JSONAPIAdapter.extend() {
  @service session;

  urlForQueryRecord() {
    return `/v1${ENV.APP.userEndpoint}`;
  }

  urlForFindRecord() {
    return `/v1${super.urlForFindRecord(...arguments)}`;
  }

  urlForCreateRecord() {
    return ENV.APP.registrationEndpoint;
  }

  // FIXME: dedupe from application
  @computed('session.{data.authenticated.token,isAuthenticated}')
  get headers() {
    let headers = {};
    if (this.session.isAuthenticated) {
      headers[
        'Authorization'
      ] = `Bearer ${this.session.data.authenticated.token}`;
    }
    headers['Content-Type'] = 'application/vnd.api+json';

    return headers;
  }
}
