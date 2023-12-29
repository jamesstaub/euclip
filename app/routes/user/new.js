import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class UserNewRoute extends Route {
  @service currentUser;
  @service store;
  @service router;

  async beforeModel() {
    if (this.currentUser.user) {
      // TODO if save fails then delete the created project and show error
      const project = await this.store
        .createRecord('project', {
          creator: this.currentUser.user,
          title: 'untitled',
        })
        .save();

      return this.router.transitionTo(
        'user.creator.project',
        this.currentUser.user,
        project
      );
    }
  }
}
