import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class LoginController extends Controller {
  @tracked loginView
  @service session
  
  constructor(){
    super(...arguments);
    this.username = 'euclip';
    this.password = '3uCl1p#';
    this.loginView = true;
  }

  get toggleViewTxt() {
    return this.loginView ? "Sign up" : "Log in";
  }

  @action
  async authenticate() {
    try {
      if (!this.loginView) {
        const user = this.store.createRecord('user', {
          username: this.username,
          email: this.email,
          password: this.password
        });
        await user.save();
      }

      await this.session.authenticate('authenticator:euclip-auth', this.username, this.password);
    } catch (error) {
      this.set('errorMessage', error.errors?.firstObject.title || error.errors?.firstObject || error.statusText || error);
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

  @action
  toggleView() {
    this.loginView = !this.loginView;
  }
}
