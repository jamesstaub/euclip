import ProjectAudioModel from '../audio-models/project';
import DS from 'ember-data';
const { hasMany, belongsTo, attr } = DS;

export default class ProjectModel extends ProjectAudioModel {
  @attr('string') title;
  @attr('string') slug;
  @belongsTo('user') creator;
  @hasMany('track') tracks;
}
