import Model, { attr, belongsTo } from '@ember-data/model';
import type ProjectModel from 'euclip/models/project';

export interface SequenceSettings {
  order: number;
  hits: number;
  steps: number;
  offset: number;
  kind?: 'euclidean' | 'binary' | 'onoff'; // snapshots saved before the other kinds existed have none of these
  value?: number;
  onSteps?: number;
  offSteps?: number;
  times?: number;
  rate?: number; // older snapshots have none of these either
  maxValue?: number;
  customSequence: number[] | null;
}

export interface ControlSettings {
  controlValue: number;
  defaultValue: number;
  controlArrayValue: number[] | null;
  currentUnitTransformIdx: number;
  applyHitsOnly: boolean;
  sequenceOrder: number;
  min: number;
  max: number;
  stepSize: number;
}

export interface TrackSettings {
  controls: Record<string, ControlSettings>; // keyed by "nodeType:nodeOrder:nodeAttr"
  sequences: SequenceSettings[];
  onstep?: { safeCode: string; editorContent: string };
}

export interface SnapshotData {
  tracks?: Record<string, TrackSettings>; // keyed by track id
}

/**
 * A saved state of a project: its tempo plus the settings of its tracks (control values, sequences and
 * onstep scripts). The tracks, their init scripts and the sample pool are shared by all snapshots, so
 * switching never rebuilds audio. The `snapshot-runtime` service captures and applies `data`.
 */
export default class SnapshotModel extends Model {
  @attr('string') declare name: string;
  @attr('number') declare position: number;
  @attr('number') declare bpm: number;
  @attr('json-string') declare data: SnapshotData;
  @attr('date') declare createdAt: Date;

  // @ts-ignore - model registry types
  @belongsTo('project', { async: false, inverse: 'snapshots' }) declare project: ProjectModel;

  get isActive(): boolean {
    return this.project?.activeSnapshot === this;
  }
}
