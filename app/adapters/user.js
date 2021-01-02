import JSONAPIAdapter from '@ember-data/adapter/json-api';
import DataAdapterMixin from "ember-simple-auth/mixins/data-adapter-mixin";
import ENV from '../config/environment';

export default class UserAdapter extends JSONAPIAdapter.extend(DataAdapterMixin) {
  urlForQueryRecord() {
    return ENV.APP.userEndpoint;
  }
  urlForCreateRecord() {
    return ENV.APP.registrationEndpoint;
  }
}
