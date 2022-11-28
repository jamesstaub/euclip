import ApplicationAdapter from './application';

export default class ProjectAdapter extends ApplicationAdapter {
  urlForCreateRecord() {
    throw 'Attempted to save a TrackNodeModel which which does not persist to DB';
  }
  urlForUpdateRecord() {
    throw 'Attempted to save a TrackNodeModel which which does not persist to DB';
  }
}
