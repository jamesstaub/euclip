import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class LoginController extends Controller {
  @service router;
  @service session;
  @service store;
  @service currentUser;
  @tracked errorMessage;

  @action
  async submitAuth(e) {
    e.preventDefault();
    try {
      const response = await this.session.authenticate(
        'authenticator:euclip-auth',
        this.username,
        this.password
      );

      response;
    } catch (error) {
      this.errorMessage = 'Username or password incorrect';
    }

    if (this.session.isAuthenticated) {
      await this.router.transitionTo('user.my-projects');
    }

    // dont bubble
    return false;
  }

  @action
  invalidateSession() {
    this.session.invalidate('authenticator:euclip-auth');
  }
}
