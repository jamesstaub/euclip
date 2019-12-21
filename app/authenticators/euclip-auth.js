import Base from 'ember-simple-auth/authenticators/base';
import { inject as service } from '@ember/service';
export default Base.extend({
  store: service(),
  session: service(),

  restore(data) {
    if (this.session.currentUser) {
      Promise.resolve();
    } else {
      return this.authenticate();
    }
  },

  authenticate(/*args*/) {
    return new Promise(async (resolve, reject) => {
      const user = await this.store.queryRecord('user', {});
      if (user) {
        this.session.set('currentUser', user);
        resolve();
      } else {
        reject();
      }
    });
  },

  invalidate(data) {
    this.session.set('currentUser', null);
  }
});
