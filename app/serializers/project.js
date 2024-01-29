import ApplicationSerializer from './application';

export default class ProjectSerializer extends ApplicationSerializer {
  // TODO: maybe split up ephemeral state like stepIndex from
  // the Project model
  attrs = {
    stepIndex: { serialize: false },
  };
}
