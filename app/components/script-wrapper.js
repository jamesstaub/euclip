import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';

import { useMachine } from 'ember-statecharts';
import scriptWrapperMachine from '../machines/script-wrapper-machine';

import { isPresent } from '@ember/utils';

export default class ScriptWrapperComponent extends Component {
  @service store;
  @tracked editorLineCount;

  statechart = useMachine(this, () => {
    return {
      machine: scriptWrapperMachine.withConfig({
        guards: {
          canShowInit: this._initModelPresent.bind(this),
          canShowOnstep: this._onstepModelPresent.bind(this),
        },
      }),
    };
  });

  get showPresets() {
    return this.statechart.state.matches('presets');
  }

  get showSignalGui() {
    return this.statechart.state.matches('signalGui');
  }

  get showScripts() {
    return this.statechart.state.matches('script');
  }

  get showInitScript() {
    return this.statechart.state.matches({ script: 'init' });
  }

  get showOnstepScript() {
    return this.statechart.state.matches({ script: 'onstep' });
  }

  /*
    state machine actions
  */
  @action
  openGUI() {
    this.statechart.send('OPEN_GUI');
  }

  @action
  openPresets() {
    this.statechart.send('OPEN_PRESETS');
  }

  @action
  async createScriptFromGUI(scriptModel) {
    scriptModel = await scriptModel; // convert proxy to actual model
    if (scriptModel.get('signalChainGeneratedCode')) {
      await scriptModel
        .get('updateScriptTask')
        .perform('editorContent', scriptModel.signalChainGeneratedCode);
      await scriptModel.get('runCode').perform();
    }
    this.statechart.send('CREATE_FROM_GUI');
  }

  @action
  backToScript() {
    this.statechart.send('BACK_TO_SCRIPT');
  }

  @action
  setUITypeTab(selectedTab) {
    this.statechart.send(`SET_TAB_${selectedTab.toUpperCase()}`);
  }

  @action
  setScriptTypeTab(selectedTab) {
    this.statechart.send(`SET_TAB_${selectedTab.toUpperCase()}`);
  }

  /*
    state machine guards
  */
  _initModelPresent() {
    return isPresent(this.args.track.initScript);
  }

  _onstepModelPresent() {
    return isPresent(this.args.track.onstepScript);
  }

  // since the script wrapper is only rendered once on the project level
  // dynamically update the preset menu to a value saved on the track
  // when the track changes
  setDefaultPreset(presetMenu, [selectedPresetId]) {
    presetMenu.selectedPresetId = selectedPresetId;
  }

  // TODO: replace this with a global helper/util
  // for setting a property on a model record?
  @action
  updateSignalChain(scriptModel, content) {
    // signalChainGeneratedCode is a temporary property, not persisted to the database
    // used to store the code generated by the signal chain UI temporarily before saving
    // scriptModel and invoking it
    // REFACTOR: instead of saving the rendered code as signalChainGeneratedCode,
    // this could instead save the SignalChainCreator node arrays, then render them as code upon clicking Submit
    // this would allow us to save the UI state of the signal chain after a user submits it
    scriptModel
      .get('updateScriptTask')
      .perform('signalChainGeneratedCode', content);
  }

  @action
  async applyPreset(presetId) {
    // save the selection on the track model so the dropdown updates when changing tracks\
    this.args.track.selectedPreset = presetId;
    // fetch the full preset record (with related script models)
    const preset = await this.store.findRecord('preset', presetId);
    await preset.applyToTrack.perform(this.args.track);
  }
}
