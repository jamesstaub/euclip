import Model, { attr, belongsTo } from '@ember-data/model';

export default class PresetModel extends Model {
  @attr('string') title
  
  @attr('string') initScript
  @attr('string') onstepScript

  @belongsTo('preset-collection') presetCollection
}
