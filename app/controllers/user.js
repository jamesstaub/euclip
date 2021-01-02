import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
export default class UserController extends Controller {
  @service session
  @service currentUser
  
  @action
  invalidateSession() {
    this.session.invalidate('authenticator:euclip-auth');
  }
}