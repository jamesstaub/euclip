import Service, { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import type Store from '@ember-data/store';
import type ProjectModel from 'euclip/models/project';
import type ProjectSampleModel from 'euclip/models/project-sample';
import SoundFileModel from 'euclip/models/sound-file';
import { debounce } from '@ember/runloop';
import { OnsetEngine, mixToMono } from 'euclip/utils/onsets/engine';

declare const cracked: any;

export type SampleState = 'idle' | 'loading' | 'ready' | 'error';

/** The audio of one pool sample: fetched and decoded once, however many tracks use it. */
export class PoolAudio {
  @tracked state: SampleState = 'idle';
  @tracked buffer: AudioBuffer | null = null;
  @tracked error: string | null = null;

  // Where the sample's onsets are, in seconds (not including the start and end of the file); null until
  // the sample has been decoded and analysed. See utils/onsets.
  @tracked onsets: number[] | null = null;
  @tracked threshold = DEFAULT_ONSET_THRESHOLD;

  get duration(): number | null {
    return this.buffer?.duration ?? null;
  }

  /** The cut points of the slices: the start of the file, each onset, the end of the file. Empty until analysed. */
  get boundaries(): number[] {
    const duration = this.duration;
    if (duration == null || !this.onsets) return [];
    return [0, ...this.onsets.filter((time) => time > 0 && time < duration), duration];
  }

  get sliceCount(): number {
    return Math.max(0, this.boundaries.length - 1);
  }
}

const PRELOAD_AT_ONCE = 3;
export const DEFAULT_ONSET_THRESHOLD = 0.25;
const SAVE_THRESHOLD_AFTER_MS = 500;

// catalog paths are stored with a leading slash (see ProjectSample.normalize on the server)
const normalizePath = (path: string) => (path.startsWith('/') ? path : `/${path}`);

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
  private onsetEngine = new OnsetEngine();
  private analysing = new Map<string, Promise<void>>(); // by path

  audioFor(sample: ProjectSampleModel): PoolAudio {
    return this.audioForPath(sample.path);
  }

  /** The audio entry for a catalog path (a sampler knows its file by path, not by pool record). */
  audioForPath(path: string): PoolAudio {
    const key = normalizePath(path);
    let entry = this.audio.get(key);
    if (!entry) {
      entry = new PoolAudio();
      this.audio.set(key, entry);
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
        // the sample is usable now; finding its onsets (slices) follows
        await this.analyzeOnsets(sample.path, entry, sample.onsetThreshold ?? DEFAULT_ONSET_THRESHOLD);
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

  /** Finds a decoded sample's onsets, in a worker. Quiet failure: a sample with no onsets is just one slice. */
  private analyzeOnsets(path: string, entry: PoolAudio, threshold: number): Promise<void> {
    const key = normalizePath(path);
    const running = this.analysing.get(key);
    if (running) return running;
    entry.threshold = threshold;

    const job = (async () => {
      const buffer = entry.buffer;
      if (!buffer) return;
      const run = () =>
        this.onsetEngine.analyze({ id: key, samples: mixToMono(buffer), sampleRate: buffer.sampleRate, threshold });
      try {
        entry.onsets = await run();
      } catch {
        try {
          entry.onsets = await run(); // the engine falls back to the main thread when its worker is unusable
        } catch (error) {
          console.warn(`Onset detection failed for ${path}`, error);
          entry.onsets = [];
        }
      } finally {
        this.analysing.delete(key);
      }
    })();
    this.analysing.set(key, job);
    return job;
  }

  /**
   * Makes sure a path's onsets are known: loads it through the pool if the project has it there, else
   * analyses the buffer the sampler already decoded.
   */
  async ensureAnalysis(project: ProjectModel | undefined, path: string, fallbackBuffer?: AudioBuffer): Promise<PoolAudio> {
    const key = normalizePath(path);
    const entry = this.audioForPath(key);
    if (entry.onsets) return entry;

    const sample = project?.projectSamples.find((item) => item.path === key);
    if (sample) {
      await this.load(sample);
      return entry;
    }
    if (!entry.buffer && fallbackBuffer) {
      entry.buffer = fallbackBuffer;
      entry.state = 'ready';
    }
    if (entry.buffer && !entry.onsets) await this.analyzeOnsets(key, entry, entry.threshold);
    return entry;
  }

  /** Changes a sample's onset sensitivity: re-picks its onsets at once, and saves the setting shortly after. */
  async setOnsetThreshold(sample: ProjectSampleModel, value: number): Promise<void> {
    const threshold = Math.min(Math.max(value, 0), 1);
    const entry = this.audioFor(sample);
    sample.onsetThreshold = threshold;
    entry.threshold = threshold;
    if (entry.onsets) {
      try {
        entry.onsets = await this.onsetEngine.pick(normalizePath(sample.path), threshold);
      } catch (error) {
        console.warn('Could not re-pick onsets', error);
      }
    }
    debounce(this, this.saveThreshold, sample, SAVE_THRESHOLD_AFTER_MS);
  }

  private async saveThreshold(sample: ProjectSampleModel): Promise<void> {
    if (sample.isDeleted) return;
    try {
      await sample.save();
    } catch (error) {
      console.error('Saving the onset threshold failed', error);
    }
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
