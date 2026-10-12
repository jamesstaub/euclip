import Service, { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import type Store from '@ember-data/store';
import type ProjectModel from 'euclip/models/project';
import type ProjectSampleModel from 'euclip/models/project-sample';
import SoundFileModel from 'euclip/models/sound-file';

declare const cracked: any;

export type SampleState = 'idle' | 'loading' | 'ready' | 'error';

/** The audio of one pool sample: fetched and decoded once, however many tracks use it. */
export class PoolAudio {
  @tracked state: SampleState = 'idle';
  @tracked buffer: AudioBuffer | null = null;
  @tracked error: string | null = null;

  get duration(): number | null {
    return this.buffer?.duration ?? null;
  }
}

const PRELOAD_AT_ONCE = 3;

/**
 * Owns the audio data of the project's sample pool. Each path is downloaded and decoded once; the
 * decoded `AudioBuffer` is shared. The pool records themselves (labels, paths, usage) are Ember Data
 * `project-sample`s; this service adds loading state and previewing.
 */
export default class SamplePoolService extends Service {
  @service declare store: Store;

  private audio = new Map<string, PoolAudio>(); // by path
  private loading = new Map<string, Promise<PoolAudio>>();
  private previewing: AudioBufferSourceNode | null = null;

  audioFor(sample: ProjectSampleModel): PoolAudio {
    let entry = this.audio.get(sample.path);
    if (!entry) {
      entry = new PoolAudio();
      this.audio.set(sample.path, entry);
    }
    return entry;
  }

  private context(): AudioContext {
    return cracked.getContext();
  }

  /** Downloads and decodes a sample (once). Resolves with its audio even when loading failed (see `state`). */
  load(sample: ProjectSampleModel): Promise<PoolAudio> {
    const entry = this.audioFor(sample);
    if (entry.state === 'ready') return Promise.resolve(entry);
    const running = this.loading.get(sample.path);
    if (running) return running;

    entry.state = 'loading';
    entry.error = null;
    const job = (async () => {
      try {
        const soundFile = await SoundFileModel.findOrDownload(sample.path, this.store);
        if (!soundFile.isDownloaded) throw new Error(soundFile.errorMessage ?? 'Download failed');
        const data = await (await fetch(soundFile.downloadedURI)).arrayBuffer();
        entry.buffer = await this.context().decodeAudioData(data);
        soundFile.duration = entry.buffer.duration;
        entry.state = 'ready';
      } catch (error: any) {
        entry.state = 'error';
        entry.error = error?.message ?? String(error);
      } finally {
        this.loading.delete(sample.path);
      }
      return entry;
    })();
    this.loading.set(sample.path, job);
    return job;
  }

  /** Loads every sample of the project's pool, a few at a time, in the background. */
  async preload(project: ProjectModel): Promise<void> {
    const queue = project.projectSamples.slice();
    const worker = async () => {
      for (let sample = queue.shift(); sample; sample = queue.shift()) await this.load(sample);
    };
    await Promise.all(Array.from({ length: PRELOAD_AT_ONCE }, worker));
  }

  /** Fetches the pool from the API (after tracks picked files, which adds them to the pool server side). */
  async refresh(project: ProjectModel): Promise<void> {
    await this.store.query('project-sample', { projectSlug: project.slug });
  }

  /** Adds a catalog path to the pool (or finds it, if it is already there). */
  async add(project: ProjectModel, path: string): Promise<ProjectSampleModel> {
    const existing = project.projectSamples.find((sample) => sample.path === path);
    if (existing) return existing;
    const sample = this.store.createRecord('project-sample', { project, path, label: '' }) as ProjectSampleModel;
    try {
      await sample.save();
    } catch (error) {
      sample.unloadRecord();
      throw error;
    }
    // the API returns the existing entry when the path is already there under another record id
    this.load(sample);
    return sample;
  }

  async rename(sample: ProjectSampleModel, label: string): Promise<void> {
    const trimmed = label.trim();
    if (!trimmed || trimmed === sample.label) return;
    const before = sample.label;
    sample.label = trimmed;
    try {
      await sample.save();
    } catch (error) {
      sample.label = before; // e.g. the label is taken
      throw error;
    }
  }

  /** Removes a sample from the pool. The API refuses while a track still uses it. */
  async remove(sample: ProjectSampleModel): Promise<void> {
    try {
      await sample.destroyRecord();
    } catch (error) {
      sample.rollbackAttributes();
      throw error;
    }
  }

  /** Plays a sample once (straight to the speakers, not through any track). */
  async preview(sample: ProjectSampleModel): Promise<void> {
    const entry = await this.load(sample);
    if (!entry.buffer) return;
    this.stopPreview();
    const context = this.context();
    if (context.state === 'suspended') await context.resume();
    const source = context.createBufferSource();
    source.buffer = entry.buffer;
    source.connect(context.destination);
    source.onended = () => {
      if (this.previewing === source) this.previewing = null;
    };
    source.start();
    this.previewing = source;
  }

  stopPreview(): void {
    try {
      this.previewing?.stop();
    } catch (_) {
      /* already ended */
    }
    this.previewing = null;
  }
}
