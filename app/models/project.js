import DS from 'ember-data';
const { Model, hasMany, belongsTo, attr } = DS;
export default class ProjectModel extends Model {
  @attr('string') title;
  @attr('string') slug;
  @belongsTo('user') creator;
  @hasMany('track') tracks;
}
