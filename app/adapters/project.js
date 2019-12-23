import JSONAPIAdapter from '@ember-data/adapter/json-api';

export default class ProjectAdapter extends JSONAPIAdapter {
  urlForQueryRecord(params, modelName) {
    const slug = params.slug;
    delete params.slug;
    const baseUrl = this.buildURL(modelName);
    return `${baseUrl}/${encodeURIComponent(slug)}`;
  }

  urlForFindAll(modelName, snapshot) {
    const {userId} =  snapshot.adapterOptions;
    const url = `/users/${userId}/projects`;
    return url;
  }
}
