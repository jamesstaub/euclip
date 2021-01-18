import Controller from "@ember/controller";
import { action } from '@ember/object';

export default class UserMyProjectsController extends Controller {
  // TODO:
  // De-dupe this from project controller play actions. 
  // 
  @action
  play(project) {
    this.model.forEach((project) => { 
      project.stopLoop();
    });
    project.initSignalChain();
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
    this.transitionToRoute('user.my-projects');
  }
}
