import ScriptModel from './script';

export default class OnstepScriptModel extends ScriptModel {
  name = "onstep-script"
  
  newFunction() {
    return new Function('index', 'data', 'array', this.safeCode).bind(this.track.get('scriptScope'));
  }
}
