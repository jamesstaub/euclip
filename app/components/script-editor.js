import Component from '@glimmer/component';
import { action } from '@ember/object';
import { keepLatestTask } from 'ember-concurrency-decorators';
import { timeout } from 'ember-concurrency';

export default class ScriptEditorComponent extends Component {
  
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
}
