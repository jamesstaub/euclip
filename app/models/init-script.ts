import ScriptModel from 'euclip/models/script';
import { belongsTo } from '@ember-data/model';
import type TrackModel from './track';
import { tracked } from '@glimmer/tracking';

export default class InitScriptModel extends ScriptModel {
  // Explicit type and initializer for `name`
  name: string = 'init-script';

  // Relationship with TrackModel
  @belongsTo('track', { async: false, inverse: 'initScript' }) declare track: TrackModel;

  /**
   * Create a new function from the safeCode and bind it to the track's scriptScope
   */
  newFunction(): (...args: unknown[]) => void {
    const scope = this.track?.scriptScope;
    return new Function(this.safeCode).bind(scope) as (...args: unknown[]) => void;
  }
}
