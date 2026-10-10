import Route from '@ember/routing/route';
import { service } from '@ember/service';
import ProjectAdapter from 'euclip/adapters/project';
import AudioFileTreeModel from 'euclip/models/audio-file-tree';
import byKey from 'euclip/utils/by-key';

export default class UserCreatorProjectRoute extends Route {
  @service store;
  @service notifications;
  @service router;

  model({ slug }) {
    return this.store.queryRecord('project', {
      slug: slug,
      creatorId: this.paramsFor('user.creator').user_id,
      include: ProjectAdapter.projectIncludeParams,
    });
  }

  // TODO: there was a bug where initSignalChain hung forever.
  // add a loading indicator that resolves with afterModel
  async afterModel(project) {
    await project.initSignalChain();
    return project;
  }

  setupController(controller, project) {
    controller.fetchAudioFileTrees(project);
    const defaultAudioFileTree = AudioFileTreeModel.createRecord(this.store);
    controller.setProperties({
      activeTrack: project.tracks[0],
      defaultAudioFileTree: defaultAudioFileTree,
      model: project,
      sortedTracks: project.tracks.slice().sort(byKey('order')),
    });
    this.getPresets(controller);
  }

  async getPresets(controller) {
    const presetCollections = await this.store.findAll('preset-collection', {
      include: 'presets',
    });
    controller.set('presetCollections', presetCollections);
  }
}
