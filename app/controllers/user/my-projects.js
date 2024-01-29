import Controller from '@ember/controller';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
export default class UserMyProjectsController extends Controller {
  // TODO:
  // De-dupe this from project controller play actions.
  //
  @service router;
  @service notifications;

  @action
  async play(project) {
    this.model.forEach((project) => {
      project.stopLoop();
    });
    await project.initSignalChain();
    project.startLoop();
  }

  @action
  stop(project) {
    project.stopLoop();
  }

  @action
  async deleteProject(project) {
    project.stopLoop();
    try {
      await project.destroyRecord();
      this.router.transitionTo('user.my-projects');
    } catch (error) {
      let message = 'There was an error deleting this project';
      if (error.errors[0].status === '403') {
        message = 'You do not have permission to delete this project';
      }
      this.notifications.push({
        message,
        type: 'error',
      });
    }
  }
}
