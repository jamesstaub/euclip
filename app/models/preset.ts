import Model, { attr, belongsTo } from '@ember-data/model';
import { task } from 'ember-concurrency';
import type { TaskGenerator } from 'ember-concurrency';
// @ts-ignore - Module resolution issues with mixed .js/.ts files
import type PresetCollectionModel from 'euclip/models/preset-collection';
// @ts-ignore - Module resolution issues with mixed .js/.ts files
import type TrackModel from 'euclip/models/track';

export default class PresetModel extends Model {
  @attr('string') declare title: string;

  @attr('string') declare initScript: string;
  @attr('string') declare onstepScript: string;

  // @ts-ignore - Model registry types are not working properly
  @belongsTo('preset-collection', { async: false, inverse: 'presets' })
  declare presetCollection: PresetCollectionModel;

  @task
  *applyToTrack(track: TrackModel): TaskGenerator<void> {
    const initScriptCode = this.initScript;
    const onstepScriptCode = this.onstepScript;

    if (onstepScriptCode) {
      let script = track.get('onstepScript');
      script.set('editorContent', onstepScriptCode);
      // @ts-ignore - Task types not properly defined
      yield script.get('runCode').perform();
    }
    if (initScriptCode) {
      let script = track.get('initScript');
      script.set('editorContent', initScriptCode);
      // @ts-ignore - Task types not properly defined
      script.get('runCode').perform();
    }
  }
}
