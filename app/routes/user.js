import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import ENV from '../config/environment';

export default class UserRoute extends Route {
  @service session
  constructor() {
    // fetch(ENV.APP.DRUMSERVER_HOST); // fire a ping to wakeup free heroku server
    super(...arguments);
  }
}
