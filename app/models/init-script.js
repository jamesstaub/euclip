import ScriptModel from './script';
import { belongsTo } from '@ember-data/model';

export default class InitScriptModel extends ScriptModel {
  name = 'init-script';

  @belongsTo('track', { async: false, inverse: 'initScript' }) track;

  // PERFORMANCE: right now this gets called everytime a character is entered in the script
  // editor, probably only necessary when trying to save or validate a script
  newFunction() {
    return new Function(this.safeCode).bind(this.track.get('scriptScope'));
  }
}
