import Model, { attr } from '@ember-data/model';
import {
  keepLatestTask,
  restartableTask,
  timeout,
  waitForProperty,
} from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';
import type TrackModel from './track';

export default class ScriptModel extends Model {
  @attr('string') declare code: string;   // the code written by the user which has been submitted

  @attr('string') declare safeCode: string;   // code after server runs security parser. READ ONLY. written by API only never writable by the client

  @attr('string') declare editorContent: string;   // the current state of the editor, regardless of it being submitted


  @tracked alert: string | null = null;
  @tracked scriptScope: any = null;

  declare track: TrackModel;
  declare name: string;

  // create the function referecne and bind it's scope
  get functionRef(): (...args: unknown[]) => void {
    if (this.safeCode) {
      try {
        // newFunction defined in inherited script class
        return this.newFunction();
      } catch (e: any) {
        this.onScriptError(e, 'Syntax error:');
      }
    }
    return () => {};
  }

  /**
   * Call the Function created of the user-defined script text
   * wrapped in error hanlder to display problems in the UI
   */
  invokeFunctionRef(...args: unknown[]) {
    try {
      this.alert = null;
      this.functionRef(...args);
    } catch (e: any) {
      console.error(`Problem Running Script on Track ${this.track?.order}`, e);
      this.onScriptError(e, 'Problem Running Script:');
    }
  }

  async onScriptError(e: Error, type: string) {
    const project = await this.track?.project;
    if (!project) {
      debugger;
    }
    project.stopLoop().resetLoop();

    await timeout(100); // Avoid double render
    this.alert = `${type} ${e.message || e}`;
  }

  newFunction(): (...args: unknown[]) => void {
    const scope = this.track?.scriptScope;
    return new Function(this.safeCode).bind(scope);
  }


  /**
   * Task to save a property on the script model instance
   * sets the `code` property to the current editorContnet, then saves it to API
   * API will return a paylaod with a `safeCode` property, which is ultimately what gets used
   * to create audio nodes
   */

  @keepLatestTask
  *runCode(): any {
    this.alert = null;
    yield waitForProperty(this.updateScriptTask as any, 'isIdle', (v: unknown) => v === true);
    this.code = this.editorContent;
    yield this.save();

    if (this.name === 'init-script') {
      if (this.track.project.isPlaying) {
            // clean reset on delete to prevent the _loopListeners array gets cleared out in cracked

        this.track.project.stopLoop();
        yield this.track.project.initSignalChain();
        this.track.project.startLoop();
      } else {
        yield this.track.project.initSignalChain();
      }
    }

    yield timeout(500);
  }

  @restartableTask
  *updateScriptTask(property: keyof this, value: any): any {
    this[property] = value;

    if (property === 'editorContent') {
      yield timeout(1000);
    }

    if (this.get('isDeleted')) {
      return;
    }

    yield this.save();
  }
}
