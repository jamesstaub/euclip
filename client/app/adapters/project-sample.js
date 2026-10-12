import ApplicationAdapter from './application';

// The pool is listed and added to under its project; a single sample is addressed on its own.
export default class ProjectSampleAdapter extends ApplicationAdapter {
  urlForQuery(query) {
    return `/projects/${query.projectSlug}/samples`;
  }

  urlForCreateRecord(modelName, snapshot) {
    return `/projects/${snapshot.record.project.get('slug')}/samples`;
  }

  urlForUpdateRecord(id) {
    return `/samples/${id}`;
  }

  urlForDeleteRecord(id) {
    return `/samples/${id}`;
  }
}
