import Route from '@ember/routing/route';
import { service } from '@ember/service';
export default class UserCreatorRoute extends Route {
  @service store;

  model() {
    return;
  }
}
