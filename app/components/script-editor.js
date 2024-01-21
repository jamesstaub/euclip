import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class ScriptEditorComponent extends Component {
  @service router;
  @tracked renderFlag = 0; // integer passed to codemirror modifier to retrigger an upage to the editor's content

  get functionIsLoaded() {
    const { code, safeCode, editorContent, functionRef } =
      this.args.scriptModel;

    return (
      (code === editorContent || editorContent === safeCode) && functionRef
    );
  }

  get canRevert() {
    const { safeCode, editorContent } = this.args.scriptModel;
    return safeCode !== editorContent;
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

  @action
  updateEditorContent(value) {
    this.args.scriptModel.updateScriptTask.perform('editorContent', value);
  }
}
