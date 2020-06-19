import JSONAPIAdapter from '@ember-data/adapter/json-api';

export default class TrackAdapter extends JSONAPIAdapter {
  // TODO cleanup by overwriting buildUrl method
  urlForCreateRecord(modelName, snapshot) {
    let url = `/projects/${snapshot.record.project.get('slug')}/tracks?include=init-script,onstep-script`;
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