import JSONAPIAdapter from '@ember-data/adapter/json-api';

export default class TrackAdapter extends JSONAPIAdapter {
  // TODO cleanup by overwriting buildUrl method
  urlForCreateRecord(modelName, snapshot) {
    return `/projects/${snapshot.record.project.get('slug')}/tracks?include=init-script,onstep-script`;
  }

  urlForFindRecord(id, modelName, { adapterOptions }) {
    const slug = adapterOptions.slug;
    return `/projects/${slug}/tracks/${id}`;
  }
}
