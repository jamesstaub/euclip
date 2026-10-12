import Service, { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import type Store from '@ember-data/store';
import type ProjectModel from 'euclip/models/project';
import type SnapshotModel from 'euclip/models/snapshot';
import type TrackModel from 'euclip/models/track';
import { SNAPSHOT_INCLUDE } from 'euclip/adapters/snapshot';
import { fadeBus, removeBus } from 'euclip/utils/snapshot-bus';
import { unbindFromSequencer } from 'euclip/utils/cracked';
import byKey from 'euclip/utils/by-key';
import { debugLog } from 'euclip/utils/debug-log';

declare const __: any;

export type StageState = 'idle' | 'staging' | 'ready' | 'error';

const MAX_WARM = 4; // how many snapshots are kept built in the background
const DISPOSE_AFTER_MS = 250; // the old snapshot's bus is closed at the swap; its nodes are removed shortly after

// let the browser run its own work (the loop's timers, rendering) between slices of staging work
const yieldToBrowser = (): Promise<void> =>
  new Promise((resolve) => {
    const ric = (window as any).requestIdleCallback;
    if (ric) ric(() => resolve(), { timeout: 50 });
    else setTimeout(resolve, 0);
  });

/**
 * Builds snapshots' audio in the background and switches between them without waiting.
 *
 * - **stage**: build a snapshot's tracks (one track per idle slice) with its output bus closed, so it makes
 *   no sound and its step listeners are not running.
 * - **switch**: on the *next step* of the loop, stop the old snapshot's listeners, start the new one's at the
 *   current loop position, change the tempo, and crossfade the buses. Nothing is downloaded, decoded or run at
 *   that moment: the swap itself is a few listener binds and two gain ramps.
 *
 * A switch to a snapshot that is not staged yet waits for staging to finish first, then happens on the next step.
 */
export default class SnapshotRuntimeService extends Service {
  @service declare store: Store;

  // staging state by snapshot id (reassigned on change so templates update)
  @tracked states: Record<string, StageState> = {};
  // the snapshot waiting for the next step, if any
  @tracked pendingSnapshot: SnapshotModel | null = null;

  private staging = new Map<string, Promise<void>>();
  private pending: { snapshot: SnapshotModel; resolve: () => void } | null = null;

  stateOf(snapshot: SnapshotModel): StageState {
    return this.states[snapshot.id] ?? 'idle';
  }

  private setState(snapshot: SnapshotModel, state: StageState): void {
    this.states = { ...this.states, [snapshot.id]: state };
  }

  private orderedTracks(snapshot: SnapshotModel): TrackModel[] {
    const tracks = snapshot.tracks.slice() as TrackModel[];
    // the main output first (other tracks connect to it), then the rest in order
    return [...tracks.filter((t) => t.isMaster), ...tracks.filter((t) => !t.isMaster).sort(byKey('order'))];
  }

  /** A snapshot's tracks come with the project only for the active one; fetch the others when first needed. */
  private async ensureLoaded(snapshot: SnapshotModel): Promise<void> {
    // `value()` is null while any of the related records is not in the store (reading `tracks` would assert)
    if (snapshot.hasMany('tracks').value()) return;
    await this.store.findRecord('snapshot', snapshot.id, { reload: true, include: SNAPSHOT_INCLUDE } as any);
  }

  /** Build a snapshot's audio in the background, silent and not stepping. Safe to call repeatedly. */
  stage(snapshot: SnapshotModel): Promise<void> {
    if (snapshot.isActive) return Promise.resolve(); // already live
    const running = this.staging.get(snapshot.id);
    if (running) return running;
    if (this.stateOf(snapshot) === 'ready') return Promise.resolve();

    this.setState(snapshot, 'staging');
    const job = (async () => {
      try {
        await this.ensureLoaded(snapshot);
        const tracks = this.orderedTracks(snapshot);
        await Promise.all(tracks.map((track) => track.findOrDownloadSoundFiles())); // samples first
        for (const track of tracks) {
          await yieldToBrowser();
          if (snapshot.isActive) return; // it was switched in while we were staging: the normal build handles it
          track.setupAudioFromScripts(true, { bind: false });
        }
        this.setState(snapshot, 'ready');
        debugLog('runtime', `staged snapshot ${snapshot.name}`, tracks.length, 'tracks');
      } catch (error) {
        console.error(`Staging snapshot ${snapshot.name} failed`, error);
        this.setState(snapshot, 'error');
        throw error;
      } finally {
        this.staging.delete(snapshot.id);
      }
    })();
    this.staging.set(snapshot.id, job);
    return job;
  }

  /** Stage the project's other snapshots one after another, up to MAX_WARM, so switching is instant. */
  async warm(project: ProjectModel): Promise<void> {
    const others = project.snapshots.filter((s) => !s.isActive).slice(0, MAX_WARM);
    for (const snapshot of others) {
      try {
        await this.stage(snapshot);
      } catch (_) {
        /* state is 'error'; the user sees it on the snapshot */
      }
    }
  }

  /** Remove a snapshot's built audio (it can be staged again later). */
  unstage(snapshot: SnapshotModel): void {
    snapshot.tracks.forEach((track: TrackModel) => track.unbindAndRemoveCrackedNodes());
    if (!snapshot.isActive) removeBus(snapshot.id);
    this.setState(snapshot, 'idle');
  }

  /** Tear down every staged snapshot of a project (leaving the project). */
  unstageAll(project: ProjectModel): void {
    this.pending = null;
    this.pendingSnapshot = null;
    project.snapshots.forEach((snapshot) => {
      if (!snapshot.isActive) this.unstage(snapshot);
    });
    this.states = {};
  }

  /**
   * Make `target` the active snapshot. While playing this happens on the next step (after staging, if it
   * was not already staged); while stopped it is immediate. Resolves once the switch has happened.
   */
  async switchTo(target: SnapshotModel): Promise<void> {
    const project = target.project;
    if (target.isActive) return;

    if (!project.isPlaying) {
      this.swapStopped(target);
      return;
    }

    await this.stage(target);
    if (target.isActive) return;

    return new Promise<void>((resolve) => {
      // a newer request replaces an older one that has not fired yet
      this.pending?.resolve();
      this.pending = { snapshot: target, resolve };
      this.pendingSnapshot = target;
      this.installStepHook(project);
    });
  }

  // cracked calls this once per step, before it runs any step listeners, so a swap done here lands exactly on a step
  private installStepHook(project: ProjectModel): void {
    __.loop({ interval: project.loopInterval }, () => this.onStep(), []);
  }

  private onStep(): void {
    const request = this.pending;
    if (!request) return;
    this.pending = null;
    this.pendingSnapshot = null;
    this.swapPlaying(request.snapshot);
    request.resolve();
  }

  private swapPlaying(target: SnapshotModel): void {
    const project = target.project;
    const old = project.activeSnapshot;
    const oldTracks = this.orderedTracks(old);
    const newTracks = this.orderedTracks(target);

    // 1. the old snapshot stops stepping (its notes' tails are cut by closing its bus below)
    oldTracks.forEach((track) => unbindFromSequencer(track.stableSelector));

    // 2. the new snapshot is the active one: the track list, tempo and edits now belong to it
    project.activeSnapshot = target;
    __.loop(project.loopInterval); // the tempo may differ (this also re-times cracked's loop worker)

    // 3. its tracks start stepping at the current loop position (phase-aligned with what was playing)
    newTracks.forEach((track) => track.bindToSequencer());

    // 4. crossfade the output buses
    fadeBus(old.id, 0);
    fadeBus(target.id, 1);
    this.setState(target, 'ready');

    this.persistActive(target);

    // 5. remove the old graph, then rebuild it silently so switching back is instant too
    setTimeout(async () => {
      if (old.isActive) return; // switched back in the meantime
      this.unstage(old);
      try {
        await this.stage(old);
      } catch (_) {
        /* state is 'error' */
      }
    }, DISPOSE_AFTER_MS);
  }

  // stopped: nothing is sounding, so just move the active snapshot (the next play builds it normally)
  private swapStopped(target: SnapshotModel): void {
    const project = target.project;
    const old = project.activeSnapshot;
    this.orderedTracks(old).forEach((track) => track.unbindAndRemoveCrackedNodes());
    project.activeSnapshot = target;
    this.setState(target, 'ready');
    this.setState(old, 'idle');
    this.persistActive(target);
  }

  // tell the server which snapshot is active (in the background; the local switch already happened)
  private persistActive(snapshot: SnapshotModel): void {
    const adapter: any = this.store.adapterFor('application');
    adapter.ajax(`/v1/snapshots/${snapshot.id}/activate`, 'POST').catch((error: unknown) => {
      console.error('Could not save the active snapshot', error);
    });
  }
}
