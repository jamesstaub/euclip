import JSONAPIAdapter from '@ember-data/adapter/json-api';

export default class ProjectAdapter extends JSONAPIAdapter {
  urlForCreateRecord(modelName) {
    return `${this._buildURL(modelName)}?include=track-controls`;
  }
  urlForUpdateRecord(modelName, snapshot) {
    return `${this._buildURL(modelName, snapshot.record.id)}?include=track-controls`;
  }
}