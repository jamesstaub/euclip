import Route from '@ember/routing/route';
import { action } from '@ember/object';
import ENV from 'euclip/config/environment';
import { inject as service } from '@ember/service';

export default class UserCreatorProjectRoute extends Route {
  @service store;
  model({ slug }) {
    return this.store.queryRecord('project', {
      slug,
      include: ENV.APP.projectIncludeParams,
    });
  }

  afterModel(project) {
    return project.initSignalChain();
  }

  setupController(controller, project) {
    controller.setProperties({
      activeTrack: project.get('tracks.firstObject'),
      model: project,
    });
    this.getPresets(controller);
  }

  async getPresets(controller) {
    const presetCollections = await this.store.findAll('preset-collection', {
      include: 'presets',
    });
    controller.set('presetCollections', presetCollections);
  }

  @action
  error(error) {
    console.log(error);
    this.router.transitionTo('user.my-projects');
  }
}
