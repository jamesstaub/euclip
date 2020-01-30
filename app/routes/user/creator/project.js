import Route from '@ember/routing/route';

export default class UserCreatorProjectRoute extends Route {
  model({ slug }) {
    return this.store.queryRecord('project', { slug, include: 'creator,tracks,tracks.init-script,tracks.onstep-script' });
  }

  async afterModel(project) {
    const tracks = await project.tracks;
    const tracksReady = await Promise.all(tracks.map(async (track) => {
      const initScript = await track.initScript;
      await track.onstepScript;
      track.bindProjectEvents(project, initScript);
      return track;
    }));
    project.initSignalChain();
    return tracksReady;
  }

  setupController(controller, project) {
    controller.setProperties({
      activeTrack: project.get('tracks.firstObject'),
      model: project
    });
  }
}