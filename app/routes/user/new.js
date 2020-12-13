import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class UserNewRoute extends Route {
  @service currentUser;

  async beforeModel() {
    if (this.currentUser.user) {
      // TODO if save fails then delete the created project and show error
      const project = this.store.createRecord('project', {
        creator: this.currentUser.user,
        title: 'untitled'
      }).save();

      return this.transitionTo('user.creator.project', this.currentUser.user, project);
    } else {
      console.log('TODO anonymous user');
    }
  }
}
