import Route from '@ember/routing/route';

export default class UserCreatorProjectRoute extends Route {
  model({ slug }) {
    return this.store.queryRecord('project', { slug, include: 'creator,tracks,tracks.init-script,tracks.onstep-script' });
  }

  afterModel(project) {
    return project.awaitAndBindTracks();
  }

  setupController(controller, project) {
    controller.setProperties({
      activeTrack: project.get('tracks.firstObject'),
      model: project
    });
  }


}