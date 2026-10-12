import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
import type ProjectModel from 'euclip/models/project';
import type TrackModel from 'euclip/models/track';

/**
 * One complete state of a project: its own tracks (including its own main output) and its own tempo.
 * The project's sample pool is shared by all snapshots. Edits always apply to the project's active
 * snapshot; saving a snapshot clones it (server side).
 */
export default class SnapshotModel extends Model {
  @attr('string') declare name: string;
  @attr('number') declare position: number;
  @attr('number') declare bpm: number;
  @attr('date') declare createdAt: Date;

  // @ts-ignore - model registry types
  @belongsTo('project', { async: false, inverse: 'snapshots' }) declare project: ProjectModel;
  // @ts-ignore - model registry types
  @hasMany('track', { async: false, inverse: 'snapshot' }) declare tracks: TrackModel[];

  get isActive(): boolean {
    return this.project?.activeSnapshot === this;
  }

  // the length of one step in milliseconds at this snapshot's tempo (two steps per beat)
  get stepMs(): number {
    return 60000 / (this.bpm * 2);
  }
}
