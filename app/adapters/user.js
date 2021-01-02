import ENV from '../config/environment';
import ApplicationAdapter from './application';


export default class UserAdapter extends ApplicationAdapter {
  urlForQueryRecord() {
    return `/v1${ENV.APP.userEndpoint}`;
  }
  
  urlForCreateRecord() {
    return ENV.APP.registrationEndpoint;
  }
}
