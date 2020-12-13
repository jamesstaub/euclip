import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

export default class LoginController extends Controller {
  @service session
  
  constructor(){
    super(...arguments);
    this.username = 'euclip';
    this.password = '3uCl1p#';
  }

  @action
  async authenticate() {
    try {
      await this.session.authenticate('authenticator:euclip-auth', this.username, this.password);
    } catch (error) {
      this.set('errorMessage', error.error || error);
    }

    if (this.session.isAuthenticated) {
      this.transitionToRoute('user.my-projects');
    }
 
    // dont bubble
    return false;
  }

  @action
  invalidateSession() {
    this.session.invalidate();
  }
}
