import Controller from '@ember/controller';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class SignupController extends Controller {
  @service session;
  @service store;
  @service router;
  @tracked errorMessage;
  @tracked isSubmitting = false;

  @action
  async submitAuth(e) {
    e.preventDefault();
    this.isSubmitting = true;
    try {
      console.log(this.username, this.email, this.password);

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
    this.isSubmitting = false;

    // dont bubble
    return false;
  }
}
