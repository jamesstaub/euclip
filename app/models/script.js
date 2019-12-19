import DS from 'ember-data';
const { Model, attr } = DS;

export default class ScriptModel extends Model {
  @attr('string') text;
  @attr('string') illegalTokens;
}
