import ApplicationAdapter from './application';

// everything a snapshot's tracks need, so a snapshot is ready to build as soon as it has loaded
export const SNAPSHOT_INCLUDE =
  'tracks,tracks.sequences,tracks.track-controls,tracks.filepath-controls,tracks.init-script,tracks.onstep-script';

export default class SnapshotAdapter extends ApplicationAdapter {
  // "saving" a snapshot clones the active one on the server; the response carries the copy with its tracks
  urlForCreateRecord(modelName, snapshot) {
    const slug = snapshot.record.project.get('slug');
    return `/projects/${slug}/snapshots?include=${SNAPSHOT_INCLUDE}`;
  }

  urlForFindRecord(id) {
    return `/snapshots/${id}?include=${SNAPSHOT_INCLUDE}`;
  }
}
