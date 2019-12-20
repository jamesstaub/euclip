import DS from 'ember-data';
const { Model, hasMany, belongsTo, attr } = DS;

export default class TrackModel extends Model {
  @attr('string') type
  @belongsTo('project') project
}
