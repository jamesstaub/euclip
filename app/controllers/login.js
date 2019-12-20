import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

export default class LoginController extends Controller {
  @service session
  
  @action
  async authenticate() {
    try {
      await this.session.authenticate('authenticator:euclip-auth', this.identification, this.password);
    } catch (error) {
      this.set('errorMessage', error.error || error);
    }

    if (this.session.isAuthenticated) {
      this.transitionToRoute('user');
      // What to do with all this success?
    }
  }
}
