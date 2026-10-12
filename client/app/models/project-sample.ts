import Model, { attr, belongsTo } from '@ember-data/model';
import type ProjectModel from 'euclip/models/project';

export interface SampleUsage {
  trackId: number;
  slot: number;
}

/**
 * A sample in a project's pool: shared by every snapshot, picked by tracks through their sampler slots.
 * (Downloading and decoding it is the SamplePool service's job, not this record's.)
 */
export default class ProjectSampleModel extends Model {
  @attr('string') declare path: string; // catalog path, e.g. "/Roland/TR 808/kick.mp3"
  @attr('string') declare label: string; // short name for scripts and the UI
  @attr('number') declare position: number;
  @attr() declare usages: { track_id: number; slot: number }[] | null;

  // @ts-ignore - model registry types
  @belongsTo('project', { async: false, inverse: 'projectSamples' }) declare project: ProjectModel;

  get isUsed(): boolean {
    return (this.usages?.length ?? 0) > 0;
  }
}
