import ApplicationAdapter from './application';

export default class TrackAdapter extends ApplicationAdapter {
  // TODO cleanup by overwriting buildUrl method
  urlForCreateRecord(modelName, snapshot) {
    let url = `/projects/${snapshot.record.project.get('slug')}/tracks?include=project,init-script,onstep-script`;
    if (snapshot.adapterOptions?.duplicateId) {
      let includes = `track-nodes,track-controls`
      url = `${url},${includes}&duplicateId=${snapshot.adapterOptions?.duplicateId}`;
    }
    return url;
  }

  urlForFindRecord(id, modelName, { adapterOptions }) {
    const slug = adapterOptions.slug;
    return `/projects/${slug}/tracks/${id}`;
  }
}