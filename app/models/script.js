import Model, { attr, belongsTo } from '@ember-data/model';
import { keepLatestTask, task } from 'ember-concurrency-decorators';
import { timeout } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';

export default class ScriptModel extends Model {
  @tracked safeCode
  @tracked alert
  @tracked scriptScope

  // the code written by the user which has been submitted 
  @attr('string') code;  
  // code after server runs security parser. READ ONLY. written by API only never writable by the client
  @attr('string') safeCode;
  
  // the current state of the editor, regardless of it being submitted
  @attr('string') editorContent;

  @belongsTo('track') track;

  get functionRef() {
    // create the function referecne and bind it's scope
    if (this.safeCode) {
      try {
        // newFunction defined in inherited script class
        return this.newFunction();
      } catch (e) {
        this.onScriptError(e);
      }
    }
    // expects a function to be returned
    return ()=> {};
  }

  async onScriptError(e) {
    const project = await this.get('track.project');
    project.stopLoop().resetLoop();

    await timeout(100); // hack to avoid double render
    this.alert = `problem with script ${e.message}`;
  }

  /**
   * Task to save a property on the script model instance
   * sets the `code` property to the current editorContnet, then saves it to API
   * API will return a paylaod with a `safeCode` property, which is ultimately what gets used
   * to create audio nodes
   */
 @task
 *runCode() {
   this.alert = null;
   yield this.saveScriptTask.perform('code', this.get('editorContent'));
   if (this.name === 'init-script') {
     const track = yield this.get('track');
     track.setupAudioFromScripts();
   }
 }

 @keepLatestTask
 *saveScriptTask(property, value) {
   this.set(property, value);
   yield timeout(1000);
   yield this.save();
 }
}
