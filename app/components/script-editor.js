import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';


export default class ScriptEditorComponent extends Component {
  @tracked editorContent

  get functionIsLoaded() {
    const {safeCode, editorContent, functionRef } = this.args.scriptModel.getProperties('safeCode', 'editorContent', 'functionRef');
    return (safeCode === editorContent) && functionRef;
  }

  constructor() {
    super(...arguments);
    this.initializeEditorValue();
  }
    
  /**
   * chaching editorContent property instead of passing the scriptMode.editorContent directly 
   * to ACE editor prevents a strange rendering bug
   */
  async initializeEditorValue() {
    await this.args.scriptModel;
    this.editorContent = this.args.scriptModel.get('editorContent');
  }
  
  @action
  async onUpdateEditor(content) {
    const scriptModel = await this.args.scriptModel;
    scriptModel.saveScriptTask.perform('editorContent', content);
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
    scriptModel.saveScriptTask.perform('editorContent', this.args.scriptModel.get('safeCode'));
  }

  @action
  async disableScript() {
    // await proxy to model record
    const scriptModel = await this.args.scriptModel;
    scriptModel.saveFunctionTask.perform('code', '');
    // TODO set a condition so functionRef() is null
    // this.track.set('customFunctionRef', null);
  }

}
