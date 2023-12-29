import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class SignupController extends Controller {
  @service session;
  @service store;
  @service router;
  @tracked errorMessage;

  @action
  async submitAuth(e) {
    e.preventDefault();

    try {
      const user = this.store.createRecord('user', {
        username: this.username,
        email: this.email,
        password: this.password,
      });
      await user.save();
      try {
        await this.session.authenticate(
          'authenticator:euclip-auth',
          this.username,
          this.password
        );
      } catch (error) {
        this.errorMessage = 'Error authenticating new user';
      }
    } catch (error) {
      this.errorMessage = error;
    }

    if (this.session.isAuthenticated) {
      await this.router.transitionTo('user.my-projects');
    }

    // dont bubble
    return false;
  }
}
