import JSONAPIAdapter from '@ember-data/adapter/json-api';

export default class ProjectAdapter extends JSONAPIAdapter {
  urlForFindAll(modelName, snapshot) {
    const {userId} =  snapshot.adapterOptions;
    const url = `/users/${userId}/projects`;
    return url;
  }
}
