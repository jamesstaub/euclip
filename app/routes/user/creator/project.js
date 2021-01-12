import Route from '@ember/routing/route';
import { action } from '@ember/object';
import ENV from 'euclip/config/environment';

export default class UserCreatorProjectRoute extends Route {
  model({ slug }) {
    return this.store.queryRecord('project', { slug, include: ENV.APP.projectIncludeParams });
  }

  afterModel(project) {
    return project.initSignalChain();
  }

  setupController(controller, project) {
    controller.setProperties({
      activeTrack: project.get('tracks.firstObject'),
      model: project
    });
    this.getPresets(controller);
  }

  async getPresets(controller) {
    const response = await fetch('/v1/presets');
    const presets = await response.json();
    controller.set('presets', presets);
  }

  @action
  error(error) {
    console.log(error);
    this.transitionTo('user.my-projects');
  }

}