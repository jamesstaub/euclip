import ScriptModel from './script';

export default class OnstepScriptModel extends ScriptModel {
  newFunction() {
    return new Function('index', 'data', 'array', this.code).bind(this.track.get('scriptScope'));
  }
}
