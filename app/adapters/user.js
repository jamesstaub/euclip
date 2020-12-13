import ApplicationAdapter from './application';
import ENV from '../config/environment';

export default class UserAdapter extends ApplicationAdapter {
  urlForQueryRecord() {
    return ENV.APP.userEndpoint;
  }
}
