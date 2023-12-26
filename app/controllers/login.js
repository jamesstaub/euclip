import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class LoginController extends Controller {
  @tracked loginView;
  @service router;
  @service session;
  @service store;
  @service currentUser;

  constructor() {
    super(...arguments);
    this.loginView = true;
  }

  get toggleViewTxt() {
    return this.loginView ? 'Sign up' : 'Log in';
  }

  @action
  async submitAuth(e) {
    e.preventDefault();
    try {
      if (!this.loginView) {
        const user = this.store.createRecord('user', {
          username: this.username,
          email: this.email,
          password: this.password,
        });
        await user.save();
      }

      await this.session.authenticate(
        'authenticator:euclip-auth',
        this.username,
        this.password
      );
    } catch (error) {
      this.set(
        'errorMessage',
        error.errors?.firstObject.title ||
          error.errors?.firstObject ||
          error.statusText ||
          error
      );
    }

    if (this.session.isAuthenticated) {
      await this.router.transitionTo('user.my-projects');
    }

    // dont bubble
    return false;
  }

  @action
  invalidateSession() {
    this.session.invalidate();
  }

  @action
  toggleView() {
    this.loginView = !this.loginView;
  }
}
