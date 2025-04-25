// app/models/user.ts
import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
import type ProjectModel from './project';
import type { Collection } from '@ember-data/store/-private';
import type UserAuthModel from './user-auth';

export default class UserModel extends Model {
  @attr('string') declare username: string;
  @attr('string') declare email: string;
  @attr('string') declare avatar: string;

  // ⚠️ WARNING: Don't store this client-side after POSTing.
  @attr('string') declare password: string;

  @hasMany('project', { async: false }) declare projects: Collection<ProjectModel>;
  @belongsTo('user-auth', { async: false, inverse: 'user' }) declare userAuth: UserAuthModel
}

