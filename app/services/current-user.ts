import Service, { inject as service } from '@ember/service';
import type SessionService from 'ember-simple-auth/services/session';
import type Store from '@ember-data/store';
import type ModelRegistry from 'ember-data/registries/model';
import type UserModel from 'euclip/models/user';

export default class CurrentUserService extends Service {
  @service session!: SessionService;
  @service store!: Store;

  user: UserModel | null = null;

  async load() {
    if (this.session.isAuthenticated) {
      return this.findFromSession();
    }
  }

  async findFromSession() {
    let userId = this.session.data.authenticated.data?.id;
    if (!userId && this.session.data.authenticated.authenticator == 'authenticator:discord') {
      userId = this.session.data.authenticated.data.user.data.id
    }
    let user = await this.store.findRecord('user', userId);
    this.user = user;
  }
}
