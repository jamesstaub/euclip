import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';

import { timeout } from 'ember-concurrency';
import { restartableTask } from 'ember-concurrency-decorators';
export default class ScriptEditorComponent extends Component {

  @service router;

  get functionIsLoaded() {
    const {safeCode, editorContent, functionRef } = this.args.scriptModel.getProperties('safeCode', 'editorContent', 'functionRef');
    return (safeCode === editorContent) && functionRef;
  }

  get editorContent() {
    return this.args.editorContent;
  }

  @restartableTask
  *onUpdateEditor(content) {
    // hack to avoid a double-submit error when hitting enter
    // which causes cursor to jump
    yield timeout(100);
    const scriptModel = yield this.args.scriptModel;
    scriptModel.updateScriptTask.perform('editorContent', content);
  }

  @action
  async loadScript() {
    const scriptModel = await this.args.scriptModel;
    scriptModel.runCode.perform();
  }

  @action
  // revert the editor to the code that is currently running
  async discardChanges() {
    // await proxy to model record
    const scriptModel = await this.args.scriptModel;
    scriptModel.updateScriptTask.perform('editorContent', this.args.scriptModel.get('safeCode'));
  }

  @action
  async disableScript() {
    // await proxy to model record
    const scriptModel = await this.args.scriptModel;
    scriptModel.updateScriptTask.perform('code', '');
  }

}
