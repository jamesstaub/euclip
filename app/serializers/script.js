import ApplicationSerializer from './application';

export default class ScriptSerializer extends ApplicationSerializer {
  attrs = {
    safeCode: { serialize: false },
  };
}
