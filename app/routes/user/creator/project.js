import Route from '@ember/routing/route';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import ProjectAdapter from '../../../adapters/project';

export default class UserCreatorProjectRoute extends Route {
  @service store;
  @service router;

  model({ slug }) {
    return this.store.queryRecord('project', {
      slug,
      include: ProjectAdapter.projectIncludeParams,
    });
  }

  afterModel(project) {
    return project.initSignalChain();
  }

  setupController(controller, project) {
    controller.fetchAudioFileTrees(project);
    controller.setProperties({
      activeTrack: project.tracks[0],
      model: project,
      sortedTracks: project.tracks.sortBy('order'),
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
