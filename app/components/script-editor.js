import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { timeout, restartableTask } from 'ember-concurrency';
import { getProperties } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class ScriptEditorComponent extends Component {
  @service router;
  @tracked renderFlag = 0; // integer passed to codemirror modifier to retrigger an upage to the editor's content

  get functionIsLoaded() {
    const { code, editorContent, functionRef } = this.args.scriptModel;
    return code === editorContent && functionRef;
  }

  get canRevert() {
    const { safeCode, editorContent, functionRef } = this.args.scriptModel;
    return safeCode !== editorContent;
  }

  @restartableTask
  *onUpdateEditor(content) {
    // hack to avoid a double-submit error when hitting enter
    // which causes cursor to jump
    // yield timeout(500);
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
    scriptModel.updateScriptTask.perform(
      'editorContent',
      this.args.scriptModel.get('safeCode')
    );
    // pass to modifier to update codemirror when
    // code changes from above
    this.renderFlag = ++this.renderFlag;
  }

  @action
  async disableScript() {
    // await proxy to model record
    const scriptModel = await this.args.scriptModel;

    // set `code` and save, API response will set this
    // value on `safeCode`, which is what actually gets run
    scriptModel.updateScriptTask.perform('code', '');
  }
}
