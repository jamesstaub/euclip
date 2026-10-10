import Route from '@ember/routing/route';
import { service } from '@ember/service';
export default class UserErrorRoute extends Route {
  @service session;
}
