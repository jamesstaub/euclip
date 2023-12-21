import { belongsTo } from '@ember-data/model';
import ScriptModel from './script';

export default class OnstepScriptModel extends ScriptModel {
  name = 'onstep-script';
  @belongsTo('track', { async: false, inverse: 'onstepScript' }) track;

  newFunction() {
    return new Function('index', 'data', 'array', this.safeCode).bind(
      this.track.get('scriptScope')
    );
  }
}
