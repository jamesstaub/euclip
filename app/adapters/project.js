import ApplicationAdapter from "./application";

export default class ProjectAdapter extends ApplicationAdapter {
  urlForQueryRecord(params, modelName) {
    const slug = params.slug;
    delete params.slug;
    return `/projects/${encodeURIComponent(slug)}`;
  }

  urlForFindAll(modelName, snapshot) {
    const {userId} =  snapshot.adapterOptions;
    const url = `/users/${userId}/projects`;
    return url;
  }
}
