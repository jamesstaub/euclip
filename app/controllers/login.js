import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

export default class LoginController extends Controller {
  @service session
  
  constructor(){
    super(...arguments);
    this.email = 'admin@admin.com';
    this.password = 'admin123';
  }
 
  @action
  async authenticate() {
    try {
      await this.session.authenticate('authenticator:euclip-auth', this.email,this.password);
    } catch (error) {
      this.set('errorMessage', error.error || error);
    }

    if (this.session.isAuthenticated) {
      this.transitionToRoute('user.my-projects');
      // What to do with all this success?
    }
    // dont bubble
    return false;
  }
}
