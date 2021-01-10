import ApplicationAdapter from "./application";
import ENV from 'euclip/config/environment';

export default class ProjectAdapter extends ApplicationAdapter {
  urlForQueryRecord(params, modelName) {
    const slug = params.slug;
    delete params.slug;
    return `/projects/${encodeURIComponent(slug)}`;
  }

  urlForFindAll(modelName, snapshot) {
    const {userId} = snapshot.adapterOptions;
    const url = `/users/${userId}/projects?include=${ENV.APP.projectIncludeParams}`;
    return url;
  }

  urlForCreateRecord() {
    const url = super.urlForCreateRecord(...arguments);
    return `${url}?include=${ENV.APP.projectIncludeParams}`;
  }
}
