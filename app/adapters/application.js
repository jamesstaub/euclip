import JSONAPIAdapter from '@ember-data/adapter/json-api';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

export default class ApplicationAdapter extends JSONAPIAdapter.extend() {
  @service session;

  buildURL() {
    return `/v1${super.buildURL(...arguments)}`;
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

  handleResponse(status) {
    if (status === 401 && this.session.isAuthenticated) {
      this.session.invalidate();
    }
    return super.handleResponse(...arguments);
  }
}
