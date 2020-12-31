import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';


export default class ScriptEditorComponent extends Component {
  @tracked editorContent
  @service router;

  get functionIsLoaded() {
    const {safeCode, editorContent, functionRef } = this.args.scriptModel.getProperties('safeCode', 'editorContent', 'functionRef');
    return (safeCode === editorContent) && functionRef;
  }

  constructor() {
    super(...arguments);
    this.initializeEditorValue();
    
    // make sure editor content doesn't get stuck when changing tracks
    this.router.on('routeDidChange', this.initializeEditorValue.bind(this));
  }
    
  /**
   * chaching editorContent property instead of passing the scriptMode.editorContent directly 
   * to ACE editor prevents a strange rendering bug
   */
  initializeEditorValue() {
    if (this.args.scriptModel) {
      this.editorContent = this.args.scriptModel.get('editorContent');
    }
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
    scriptModel.saveScriptTask.perform('code', '');
  }

}
