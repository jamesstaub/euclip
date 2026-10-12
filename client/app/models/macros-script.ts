import { belongsTo } from '@ember-data/model';
import ScriptModel from './script';
import type ProjectModel from 'euclip/models/project';

/**
 * The project-wide script where macros are registered (`this.defineMacro`, `this.declareControls`). It runs
 * before any track's setup script on every build and creates no audio nodes itself.
 */
export default class MacrosScriptModel extends ScriptModel {
  name = 'macros-script';

  @belongsTo('project', { async: false, inverse: 'macrosScript' }) declare project: ProjectModel;

  newFunction(): (...args: unknown[]) => void {
    return new Function(this.safeCode).bind(this.project?.macrosScope) as (...args: unknown[]) => void;
  }
}
