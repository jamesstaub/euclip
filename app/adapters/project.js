import ApplicationAdapter from './application';

export default class ProjectAdapter extends ApplicationAdapter {
  static projectIncludeParams =
    'creator,tracks,tracks.sequences,tracks.track-controls,tracks.init-script,tracks.onstep-script';

  urlForQueryRecord({ creatorId, slug }) {
    return `/users/${creatorId}/projects/${encodeURIComponent(slug)}`;
  }

  urlForFindAll(modelName, snapshot) {
    const { userId } = snapshot.adapterOptions;
    const url = `/users/${userId}/projects?include=${ProjectAdapter.projectIncludeParams}`;
    return url;
  }

  urlForCreateRecord() {
    const url = super.urlForCreateRecord(...arguments);
    return `${url}?include=${ProjectAdapter.projectIncludeParams}`;
  }
}
