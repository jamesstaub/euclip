import Model from '@ember-data/model';
import DS from 'ember-data';
const { belongsTo, hasMany, attr } = DS;

export default class TrackNodeModel extends Model {
  @belongsTo('track') track;
  @hasMany('track-control') trackControls;

  @attr('string') nodeUUID;
  @attr('string') nodeType;
  @attr('number') order;

}
