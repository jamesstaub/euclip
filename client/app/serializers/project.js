import ApplicationSerializer from './application';

export default class ProjectSerializer extends ApplicationSerializer {
  // TODO:  split up ephemeral audio-engine specific state like stepIndex from
  // the Project model
  attrs = {
    stepIndex: { serialize: false },
  };
}
