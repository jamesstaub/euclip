import Component from '@glimmer/component';
import { action } from '@ember/object';
import { keepLatestTask, task } from 'ember-concurrency-decorators';
import { timeout } from 'ember-concurrency';

export default class ScriptEditorComponent extends Component {
  get functionIsLoaded() {
    const {safeCode, editorContent, functionRef } = this.args.scriptModel.getProperties('safeCode', 'editorContent', 'functionRef');
    return (safeCode === editorContent) && functionRef;
  }
  
  /*
  Task to save a property on the script model instance
  */
  @task
  *invokeScript() {
    // TODO
    // don't actually set safeCode here. set the `code` property, then allow only the API to write safeCode

    // TODO call a checkForChangedNodes on the track model to add or remove any track-node models + controls
    yield this.saveScriptTask.perform('safeCode', this.args.scriptModel.get('editorContent'));
  }

  @keepLatestTask
  *saveScriptTask(property, value) {
    // yield proxy to model record
    const scriptModel = yield this.args.scriptModel;
    scriptModel.set(property, value);
    yield timeout(300);
    yield scriptModel.save();
  }

  @action
  onUpdateEditor(content) {
    this.saveScriptTask.perform('editorContent', content);
  }

  @action
  loadScript() {
    this.invokeScript.perform();
  }

  @action
  discardChanges() {
    // revert the editor to the code that is currently running
    this.saveScriptTask.perform('editorContent', this.args.scriptModel.get('safeCode'));
  }

  @action
  disableScript() {
    this.saveFunctionTask.perform('code', '');
    // TODO set a condition so functionRef() is null
    // this.track.set('customFunctionRef', null);
  }

}
