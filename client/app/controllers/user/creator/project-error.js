import Controller from '@ember/controller';

export default class UserCreatorProjectErrorController extends Controller {
  get firstError() {
    return this.model?.errors?.[0];
  }
}
