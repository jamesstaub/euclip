import ScriptModel from './script';

export default class InitScriptModel extends ScriptModel {
  name = 'init-script';

  // PERFORMANCE: right now this gets called everytime a character is entered in the script
  // editor, probably only necessary when trying to save or validate a script
  newFunction() {
    return new Function(this.get('safeCode')).bind(this.track.get('scriptScope'));
  }
}
