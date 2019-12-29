import ScriptModel from './script';

export default class OnstepScriptModel extends ScriptModel {
  newFunction() {
    return new Function('index', 'data', 'array', this.safeCode).bind(this.track.get('scriptScope'));
  }
}
