import Service, { inject as service } from '@ember/service';

export default class CurrentUserService extends Service {
  @service session;
  @service store;

  async load() {
    if (this.session.isAuthenticated) {
      return this.findFromSession();
    }
  }

  async findFromSession() {
    let userId = this.session.data.authenticated.data?.id;
    let user = await this.store.findRecord('user', userId);
    this.user = user;
  }
}
