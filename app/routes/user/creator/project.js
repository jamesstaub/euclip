import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import ProjectAdapter from '../../../adapters/project';
import SoundFileModel from '../../../models/sound-file';

export default class UserCreatorProjectRoute extends Route {
  @service store;
  @service router;

  model({ slug }) {
    return this.store.queryRecord('project', {
      slug,
      include: ProjectAdapter.projectIncludeParams,
    });
  }

  async afterModel(project) {
    await this.downloadSilent();
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

  // silent.mp3 is used to guarantee AudioBufferSourceNode creation
  // even before a filepath is chosen.
  // expected to be created with order 1
  async downloadSilent() {
    if (
      this.store.peekAll('sound-file')[0] &&
      this.store
        .peekAll('sound-file')[0]
        .filePathRelative.endsWith('silent.mp3')
    )
      return;

    const sf = this.store.createRecord('sound-file', {
      filePathRelative: '/assets/audio/silent.mp3',
    });
    await sf.afterCreate();
  }
}
