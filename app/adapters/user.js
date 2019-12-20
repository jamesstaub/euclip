import JSONAPIAdapter from '@ember-data/adapter/json-api';
import ENV from '../config/environment';

export default class UserAdapter extends JSONAPIAdapter {
  urlForFindRecord() {
    return ENV.APP.userEndpoint;
  }
  urlForQueryRecord() {
    return ENV.APP.userEndpoint;
  }
}
