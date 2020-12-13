import Model from '@ember-data/model'
import { attr, hasMany,  } from '@ember-data/model';

export default class UserModel extends Model {
  @attr('string') username;
  @attr('string') email;
  @attr('string') avatar;
  @hasMany('project') projects;
}
