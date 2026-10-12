import ApplicationAdapter from './application';

export default class SnapshotAdapter extends ApplicationAdapter {
  // snapshots are created under their project
  urlForCreateRecord(modelName, snapshot) {
    const slug = snapshot.record.project.get('slug');
    return `/projects/${slug}/snapshots`;
  }
}
