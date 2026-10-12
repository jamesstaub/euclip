import { action } from '@ember/object';
import Controller from '@ember/controller';
import { service } from '@ember/service';

export default class UserCreatorProjectTrackController extends Controller {
  @service projectUi;

  @action
  toggleSidebar(trackId, direction) {
    this.projectUi.current?.toggleSidebar(trackId, direction);
  }

  @action
  showFilePath(path) {
    return this.projectUi.current?.showFilePath(path);
  }

  @action
  selectSourceNode(idx) {
    this.projectUi.setSelectedSourceIdx(idx);
  }

  @action
  updateInitScript(generatedScript) {
    this.model.initScript.set('editorContent', generatedScript);
  }
}
