import DS from 'ember-data';
const { Model, attr, belongsTo } = DS;
import { tracked } from '@glimmer/tracking';

export default class ScriptModel extends Model {
  @tracked safeCode
  @tracked scriptScope

  // the code written by the user
  @attr('string') code;  
  // code after server runs security parser. API enforce never writable by the client
  @attr('string') safeCode;
  
  @attr('string') editorContent;

  @belongsTo('track') track;

  get functionRef() {
    // create the function referecne and bind it's scope
    if (this.safeCode) {
      try {
        return this.newFunction();
      } catch (e) {
        alert('problem with script', e.message);
      }
    }
    return null;
  }
}
