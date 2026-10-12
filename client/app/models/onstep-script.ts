import { attr, belongsTo } from '@ember-data/model';
import ScriptModel from './script';
import type TrackModel from 'euclip/models/track';
import scopeToSnapshot from 'euclip/utils/scope-to-snapshot';

export default class OnstepScriptModel extends ScriptModel {
  name = 'onstep-script';

  @attr('number') declare applyControlsSetting: number;

  @belongsTo('track', { async: false, inverse: 'onstepScript' }) declare track: TrackModel;

  newFunction() {
    return new Function('index', 'data', 'array', 'sequenceIndex', scopeToSnapshot(this.safeCode, this.track?.snapshot?.id)).bind(
      this.track.get('scriptScope')
    );
  }
}
