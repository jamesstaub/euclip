import ScriptModel from './script';

export default class InitScriptModel extends ScriptModel {
  newFunction() {
    return new Function(null, this.code).bind(this.track.get('scriptScope'));
  }
}
