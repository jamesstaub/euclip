import Controller from '@ember/controller';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
export default class UserMyProjectsController extends Controller {
  // TODO:
  // De-dupe this from project controller play actions.
  //
  @service router;

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
  deleteProject(project) {
    project.stopLoop();
    project.destroyRecord();
    this.router.transitionTo('user.my-projects');
  }
}
