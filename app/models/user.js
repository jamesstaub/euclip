import Model, { attr, hasMany } from '@ember-data/model';

export default class UserModel extends Model {
  @attr('string') username;
  @attr('string') email;
  @attr('string') avatar;

  // FIXME: dont store this in the client after POSTing
  @attr('string') password;
  @hasMany('project') projects;
}
