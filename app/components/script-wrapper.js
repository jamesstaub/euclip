import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { use } from 'ember-usable';
import { useMachine, matchesState } from 'ember-statecharts';
import scriptWrapperMachine from '../machines/script-wrapper-machine';
import { isPresent } from '@ember/utils';

export default class ScriptWrapperComponent extends Component {
  @service store;
  @tracked editorLineCount;

  @use statechart = useMachine(scriptWrapperMachine).withConfig({
    guards: {
      canShowInit: this._initModelPresent.bind(this),
      canShowOnstep: this._onstepModelPresent.bind(this),
    },
  });

  @matchesState('presets')
  showPresets;

  @matchesState('signalGui')
  showSignalGui;

  @matchesState({ script: 'init' })
  showInitScript;

  @matchesState({ script: 'onstep' })
  showOnstepScript;

  /*
    state machine actions
  */
  @action
  toggleInputType() {
    this.statechart.send('TOGGLE_INPUT_UI');
  }

  @action
  setScriptTypeTab(selectedTab) {
    this.statechart.send(`SET_TAB_${(selectedTab.toUpperCase())}`);
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
  setDefaultPreset(presetMenu, [selectedOptionIdx]) {
    presetMenu.selectedIndex = selectedOptionIdx;
  }

  // TODO: replace this with a global helper/util
  // for setting a property on a model record?
  @action
  updateEditorContent(scriptModel, content) {
    scriptModel.set('editorContent', content);
  }

  @action
  async selectPreset({ target }) {
    const presetId = target.value;

    // save the selection on the track model so the dropdown updates when changing tracks\
    this.args.track.selectedPreset = presetId;
    // fetch the full preset record (with related script models)
    const preset = await this.store.findRecord('preset', presetId);
    preset.applyToTrack.perform(this.args.track);
  }
}
