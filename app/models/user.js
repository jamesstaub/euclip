import DS from 'ember-data';
const { Model, hasMany, attr } = DS;

export default class UserModel extends Model {
  @attr('string') username;
  @attr('string') uid;
  @hasMany('project') projects;
}
