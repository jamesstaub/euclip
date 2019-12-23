import DS from 'ember-data';
const { Model, attr, belongsTo } = DS;
import { computed } from '@ember/object';
export default class ScriptModel extends Model {
  @attr('string') code;
  @attr('string') illegalTokens;
  @belongsTo('track') track;

  @computed('code')
  get functionRef() {
    // create the function referecne and bind it's scope
    if (this.code) {
      try {
        return this.newFunction();
      } catch (e) {
        alert('problem with script', e.message);
      }
    }
  }
}
