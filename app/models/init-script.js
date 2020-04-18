import ScriptModel from './script';

export default class InitScriptModel extends ScriptModel {
  name = "init-script"

  newFunction() {
    return new Function(this.safeCode).bind(this.track.get('scriptScope'));
  }
}
