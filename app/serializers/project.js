import ApplicationSerializer from './application';

export default class ProjectSerializer extends ApplicationSerializer {
  attrs = {
    stepIndex: { serialize: false },
  };
}
