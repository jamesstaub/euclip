import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
export default class ScriptWrapperComponent extends Component {
  @tracked scriptUi;
  
  constructor() {
    super(...arguments);
    this.scriptUi = 'init';
  }
  
  loadPreset(preset) {
    const {initScript, onstepScript} = preset;
    if (initScript) {
      let script = this.args.track.get('initScript');
      script.set('editorContent', initScript);
      script.get('runCode').perform();
    }
    if (onstepScript) {
      let script = this.args.track.get('onstepScript');
      script.set('editorContent', onstepScript);
      script.get('runCode').perform();
    }
  }

  @action
  setUi(val) {
    this.scriptUi = val;
  }

  @action
  selectPreset({target}) {
    const selectionIdx = target.value;
    this.loadPreset(this.args.presets[selectionIdx]);

  }
}
