import Model, { attr, belongsTo } from '@ember-data/model';
import { task } from 'ember-concurrency';

export default class PresetModel extends Model {
  @attr('string') title;

  @attr('string') initScript;
  @attr('string') onstepScript;

  @belongsTo('preset-collection', { async: false, inverse: 'presets' })
  presetCollection;

  @task
  *applyToTrack(track) {
    const initScriptCode = this.initScript;
    const onstepScriptCode = this.onstepScript;

    if (onstepScriptCode) {
      let script = track.get('onstepScript');
      script.set('editorContent', onstepScriptCode);
      yield script.get('runCode').perform();
    }
    if (initScriptCode) {
      let script = track.get('initScript');
      script.set('editorContent', initScriptCode);
      script.get('runCode').perform();
    }
  }
}
