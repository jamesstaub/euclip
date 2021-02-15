
import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
export default class PresetCollectionModel extends Model {
  @attr('string') title
  @hasMany('preset') presets
  @belongsTo('user') creator
}
