import JSONAPIAdapter from '@ember-data/adapter/json-api';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

export default class ApplicationAdapter extends JSONAPIAdapter {
  @service session;

  buildURL() {
    const url = super.buildURL(...arguments);
    if (url == '/registration') return url; // TODO: fix this with proper inheritance for v1 adapters
    return `/v1${url}`;
  }

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
