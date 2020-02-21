import Component from '@glimmer/component';
import { action } from '@ember/object';
import { task } from 'ember-concurrency-decorators';

export default class ScriptEditorComponent extends Component {
  
  @task
  *saveScriptTask(property, value) {
    // yield proxy to model record
    const scriptModel = yield this.args.scriptModel;
    scriptModel.set(property, value);
    yield scriptModel.save();
  }

  @action
  onUpdateEditor(content) {
    this.saveScriptTask.perform('editorContent', content);
  }
}
