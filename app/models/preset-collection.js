import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
export default class PresetCollectionModel extends Model {
  @attr('string') title;
  @hasMany('preset', { async: false, inverse: null }) presets;
  @belongsTo('user', { async: false, inverse: 'presetCollections' }) creator;
}
