import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
// @ts-ignore - Module resolution issues with mixed .js/.ts files
import type PresetModel from 'euclip/models/preset';
// @ts-ignore - Module resolution issues with mixed .js/.ts files  
import type UserModel from 'euclip/models/user';

export default class PresetCollectionModel extends Model {
  @attr('string') declare title: string;
  // @ts-ignore - Model registry types are not working properly
  @hasMany('preset', { async: false, inverse: null }) declare presets: PresetModel[];
  // @ts-ignore - Model registry types are not working properly
  @belongsTo('user', { async: false, inverse: 'presetCollections' }) declare creator: UserModel;
}
