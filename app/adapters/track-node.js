import ApplicationAdapter from './application';

export default class ProjectAdapter extends ApplicationAdapter {
  urlForCreateRecord(modelName) {
    return `${this._buildURL(modelName)}?include=track-controls`;
  }
  urlForUpdateRecord(id, modelName) {
    return `${this._buildURL(modelName, id)}?include=track-controls`;
  }
}
