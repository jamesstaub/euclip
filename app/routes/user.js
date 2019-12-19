import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class UserRoute extends Route {

  model() {
    return this.store.createRecord('user', {
      username: 'james',
      uid: 'js',
    })
  }
}
