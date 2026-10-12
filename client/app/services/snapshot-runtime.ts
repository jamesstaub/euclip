import Service, { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import type Store from '@ember-data/store';
import type ProjectModel from 'euclip/models/project';
import type SnapshotModel from 'euclip/models/snapshot';
import type { ControlSettings, SequenceSettings, SnapshotData, TrackSettings } from 'euclip/models/snapshot';
import type TrackModel from 'euclip/models/track';
import type TrackControlModel from 'euclip/models/track-control';
import type SequenceModel from 'euclip/models/sequence';

declare const __: any;

// the fields of a control that a snapshot keeps (everything the user can change, besides the sample)
const CONTROL_FIELDS: (keyof ControlSettings)[] = [
  'controlValue',
  'defaultValue',
  'controlArrayValue',
  'currentUnitTransformIdx',
  'applyHitsOnly',
  'sequenceOrder',
  'min',
  'max',
  'stepSize',
];

const SEQUENCE_FIELDS: (keyof SequenceSettings)[] = ['hits', 'steps', 'offset'];

const same = (a: unknown, b: unknown): boolean => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

const controlKey = (control: TrackControlModel): string => `${control.nodeType}:${control.nodeOrder}:${control.nodeAttr}`;

const logSaveError = (what: string) => (error: unknown) => console.error(`Could not save ${what} after switching snapshot`, error);

/**
 * Saves and switches snapshots. A snapshot is the tempo plus, for each track, its control values, sequences
 * and onstep script. All snapshots share one audio graph (the tracks and their init scripts do not change),
 * so a switch only writes a few values into the models and audio params that already exist; nothing is built,
 * downloaded or torn down. While playing, it happens on the next step: cracked calls the loop hook once per
 * step before any step listener runs, so the new settings are in place for that whole step.
 */
export default class SnapshotRuntimeService extends Service {
  @service declare store: Store;

  // the snapshot waiting for the next step, if any
  @tracked pendingSnapshot: SnapshotModel | null = null;
  private pending: { snapshot: SnapshotModel; resolve: () => void } | null = null;

  /** The current settings of all of a project's tracks. */
  capture(project: ProjectModel): SnapshotData {
    const tracks: Record<string, TrackSettings> = {};
    project.tracks.forEach((track: TrackModel) => {
      if (track.isRemoved || track.isNew) return;
      const controls: Record<string, ControlSettings> = {};
      track.trackControls.forEach((control: TrackControlModel) => {
        if (control.isDeleted || control.isNew) return;
        controls[controlKey(control)] = Object.fromEntries(
          CONTROL_FIELDS.map((field) => [field, (control as any)[field] ?? null])
        ) as unknown as ControlSettings;
      });
      const sequences = track.sortedSequences.map((sequence: SequenceModel) => ({
        order: sequence.order,
        hits: sequence.hits,
        steps: sequence.steps,
        offset: sequence.offset,
        customSequence: sequence.customSequence?.length ? sequence.customSequence.slice() : null,
      }));
      const script = track.onstepScript;
      tracks[track.id] = {
        controls,
        sequences,
        ...(script ? { onstep: { safeCode: script.safeCode, editorContent: script.editorContent } } : {}),
      };
    });
    return { tracks };
  }

  /** Writes a snapshot's settings into the project's tracks, saving whatever changed. Returns the tracks whose sequences changed. */
  apply(project: ProjectModel, snapshot: SnapshotModel): void {
    const saved = snapshot.data?.tracks ?? {};
    project.tracks.forEach((track: TrackModel) => {
      const settings = saved[track.id];
      if (!settings || track.isRemoved) return; // a track added after the snapshot was saved keeps its settings
      this.applyControls(track, settings);
      this.applySequences(track, settings);
      this.applyOnstep(track, settings);
    });
  }

  private applyControls(track: TrackModel, settings: TrackSettings): void {
    track.trackControls.forEach((control: TrackControlModel) => {
      const wanted = settings.controls?.[controlKey(control)];
      if (!wanted || control.isDeleted) return;
      let changed = false;
      for (const field of CONTROL_FIELDS) {
        if (field in wanted && !same((control as any)[field], wanted[field])) {
          (control as any)[field] = wanted[field];
          changed = true;
        }
      }
      if (!changed) return;
      control.clearModulation();
      if (!control.isMultislider) control.applyToAudio(); // multisliders are written on every step
      control.save().catch(logSaveError('a control'));
    });
  }

  private applySequences(track: TrackModel, settings: TrackSettings): void {
    const wanted = settings.sequences;
    if (!wanted?.length) return;
    let changed = false;

    for (const target of wanted) {
      let sequence = track.sequences.find((s: SequenceModel) => s.order === target.order && !s.isDeleted);
      if (!sequence) {
        sequence = this.store.createRecord('sequence', { track, order: target.order }) as SequenceModel;
        changed = true;
      }
      const differs =
        SEQUENCE_FIELDS.some((field) => sequence![field] !== target[field]) ||
        !same(sequence.customSequence?.length ? sequence.customSequence : null, target.customSequence);
      if (!differs && !sequence.isNew) continue;
      SEQUENCE_FIELDS.forEach((field) => ((sequence as any)[field] = target[field]));
      sequence.customSequence = target.customSequence ?? [];
      changed = true;
      sequence.save().catch(logSaveError('a sequence'));
    }
    // sequences the snapshot did not have
    track.sequences
      .filter((s: SequenceModel) => !s.isDeleted && !wanted.some((target) => target.order === s.order))
      .forEach((extra: SequenceModel) => {
        if (track.sequences.filter((s: SequenceModel) => !s.isDeleted).length <= 1) return; // a track keeps one
        extra.deleteRecord();
        extra.save().catch(logSaveError('a sequence'));
        changed = true;
      });

    if (changed) track.rebindSequences(); // new step arrays, started at the current loop position
  }

  private applyOnstep(track: TrackModel, settings: TrackSettings): void {
    const script = track.onstepScript;
    const wanted = settings.onstep;
    if (!script || !wanted) return;
    if (script.safeCode === wanted.safeCode && script.editorContent === wanted.editorContent) return;
    script.safeCode = wanted.safeCode; // in effect on the next call
    script.editorContent = wanted.editorContent;
    script.code = wanted.safeCode; // the API derives safe_code from `code`
    script.alert = null;
    script.save().catch(logSaveError('the onstep script'));
  }

  /** Saves the project's current state as a new snapshot (the active snapshot stays active). */
  async saveCurrent(project: ProjectModel, name?: string): Promise<SnapshotModel> {
    const active = project.activeSnapshot;
    active.data = this.capture(project); // keep the active snapshot's own copy current too
    const copy = this.store.createRecord('snapshot', {
      project,
      name: name ?? `${active.name} copy`,
      bpm: active.bpm,
      data: active.data,
    }) as SnapshotModel;
    await copy.save();
    active.save().catch(logSaveError('the active snapshot'));
    return copy;
  }

  /**
   * Make `target` the active snapshot. While playing this happens on the next step; while stopped it is
   * immediate. Resolves once the switch has happened.
   */
  async switchTo(target: SnapshotModel): Promise<void> {
    const project = target.project;
    if (target.isActive) return;

    if (!project.isPlaying) {
      this.swap(target);
      return;
    }

    return new Promise<void>((resolve) => {
      // a newer request replaces an older one that has not fired yet
      this.pending?.resolve();
      this.pending = { snapshot: target, resolve };
      this.pendingSnapshot = target;
      // cracked calls this once per step, before it runs any step listeners
      __.loop({ interval: project.loopInterval }, () => this.onStep(), []);
    });
  }

  private onStep(): void {
    const request = this.pending;
    if (!request) return;
    this.pending = null;
    this.pendingSnapshot = null;
    this.swap(request.snapshot);
    request.resolve();
  }

  private swap(target: SnapshotModel): void {
    const project = target.project;
    const old = project.activeSnapshot;

    old.data = this.capture(project); // what was playing, as edited
    project.activeSnapshot = target;
    this.apply(project, target);
    if (project.isPlaying) __.loop(project.loopInterval); // the tempo may differ (re-times cracked's loop worker)

    old.save().catch(logSaveError('the previous snapshot'));
    const adapter: any = this.store.adapterFor('application');
    adapter.ajax(`/v1/snapshots/${target.id}/activate`, 'POST').catch((error: unknown) => {
      console.error('Could not save the active snapshot', error);
    });
  }
}
