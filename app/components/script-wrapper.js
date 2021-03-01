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

  @action
  setUi(val) {
    this.scriptUi = val;
  }

  @action
  async selectPreset({target}) {
    const presetId = target.value;
    
    // save the selection on the track model so the dropdown updates when changing tracks\
    this.args.track.selectedPreset = presetId;
    // fetch the full preset record (with related script models)
    const preset = await this.store.findRecord('preset', presetId);
    preset.applyToTrack.perform(this.args.track);
  }
}
