import ScriptModel from './script';

export default class InitScriptModel extends ScriptModel {

  newFunction() {
    return new Function(this.safeCode).bind(this.track.get('scriptScope'));
  }
}
