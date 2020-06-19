import JSONAPIAdapter from '@ember-data/adapter/json-api';

export default class ProjectAdapter extends JSONAPIAdapter {
  urlForCreateRecord(modelName) {
    return `${this._buildURL(modelName)}?include=track-controls`;
  }
  urlForUpdateRecord(id, modelName) {
    return `${this._buildURL(modelName, id)}?include=track-controls`;
  }
}