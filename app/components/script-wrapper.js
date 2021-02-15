import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';

export default class ScriptWrapperComponent extends Component {
  @tracked scriptUi;
  @tracked editorLineCount;
  
  @service store;

  constructor() {
    super(...arguments);
    this.scriptUi = 'init';
  }
  
  loadPreset(preset) {
    const initScriptCode = preset.get('initScript');

    if (initScriptCode) {
      let script = this.args.track.get('initScript');
      script.set('editorContent', initScriptCode);
      script.get('runCode').perform();
    }
    const onstepScriptCode = preset.get('onstepScript');
    if (onstepScriptCode) {
      let script = this.args.track.get('onstepScript');
      script.set('editorContent', onstepScriptCode);
      script.get('runCode').perform();
    }
  }

  @action
  setUi(val) {
    this.scriptUi = val;
  }

  @action
  async selectPreset({target}) {
    const presetId = target.value;
    // fetch the full preset record (with related script models)
    const preset = await this.store.findRecord('preset', presetId);
    this.loadPreset(preset);

  }
}
