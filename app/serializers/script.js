import ApplicationSerializer from './application';
import { isNone } from '@ember/utils';

export default class ScriptSerializer extends ApplicationSerializer {
  attrs = {
    safeCode: { serialize: false },
  };

  serializeAttribute(snapshot, json, key) {
    super.serializeAttribute(...arguments);
    // should not set any attributes to null from the client
    if (json.attributes && isNone(json.attributes[key])) {
      delete json.attributes[key];
    }
  }
}
