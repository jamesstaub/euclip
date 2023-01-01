import Model, { attr, belongsTo } from '@ember-data/model';
import { keepLatestTask, task, timeout } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';

export default class ScriptModel extends Model {
  @tracked safeCode;
  @tracked alert;
  @tracked scriptScope;
  @tracked editorContent;

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
        this.onScriptError(e, 'Syntax error:');
      }
    }
    // expects a function to be returned
    return () => {};
  }

  /**
   * Call the Function created of the user-defined script text
   * wrapped in error hanlder to display problems in the UI
   */
  invokeFunctionRef() {
    try {
      this.alert = null;
      this.functionRef(...arguments);
    } catch (e) {
      this.onScriptError(e, 'Problem Running Script:');
    }
  }

  async onScriptError(e, type) {
    const project = await this.get('track.project');
    if (!project) {
      debugger;
    }
    project.stopLoop().resetLoop();

    await timeout(100); // hack to avoid double render
    this.alert = `${type} ${e.message || e}`;
  }

  /**
   * Task to save a property on the script model instance
   * sets the `code` property to the current editorContnet, then saves it to API
   * API will return a paylaod with a `safeCode` property, which is ultimately what gets used
   * to create audio nodes
   */

  @keepLatestTask
  *runCode() {
    this.alert = null;
    this.set('code', this.editorContent);
    yield this.updateScriptTask.perform('code', this.editorContent);
    if (this.name === 'init-script') {
      const track = yield this.track;
      if (track.samplerNodes.length) {
        yield track.downloadSample();
      }
      const project = yield track.get('project');
      if (project.get('isPlaying')) {
        // clean reset on delete to prevent the _loopListeners array gets cleared out in cracked
        project.stopLoop();
        project.initSignalChain();
        project.startLoop();
      }
    }
    yield timeout(1000);
  }

  // REFACTOR: is it actually meaningful to use a task for this.promise?
  // doesn't appear to be cancelable https://githubplus.com/machty/ember-concurrency/issues/463
  @task
  *updateScriptTask(property, value) {
    this.set(property, value);
    yield new Promise((resolve) => {
      this.save().then(resolve);
    });
  }
}
