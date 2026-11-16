import Service, { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { isDestroying } from '@ember/destroyable';
import { isTesting, macroCondition } from '@embroider/macros';
import { buildWaiter, waitForPromise } from '@ember/test-waiters';
import { createEngine, type Engine } from 'cracked-up';
import type { Node } from 'cracked-up';
import {
  ProjectRunner,
  type ControlView,
  type ScriptError,
  type StepGridView,
  type WaveformView,
} from 'client-v2/audio/runner';
import { newFileId, refusal, sampleNameFor } from 'client-v2/project/pool';
import { setLiveCatalog } from 'client-v2/editor/live-catalog';
import type { DeclarationWarning } from 'client-v2/controls/declarations';
import type { StoredValue } from 'client-v2/project/schema';
import type ProjectService from 'client-v2/services/project';
import type { ProjectChange } from 'client-v2/services/project';

/**
 * How long after the last edit a script is run again. There is no Run button: the pause is what keeps
 * half-typed code from running.
 */
export const RUN_DELAY_MS = 300;

const runWaiter = buildWaiter('euclip:script-run');

/**
 * The app's one audio engine, and the project running on it.
 *
 * The engine is made at boot on a suspended AudioContext, so the graph exists (and the UI can show the
 * nodes and sequences the scripts make) before any gesture. Play resumes the context from inside the
 * click, which is what browsers (iOS Safari especially) require before sound may start.
 *
 * Everything the UI reads from here depends on `revision`, a counter bumped whenever the running project
 * changes; playheads have their own counter because they move on every step.
 */
export default class AudioService extends Service {
  @service declare project: ProjectService;

  /**
   * Makes the audio context. Tests replace this (before `boot`) or get the default below: an
   * OfflineAudioContext, which builds the same graph and never touches the sound card.
   */
  contextFactory: () => BaseAudioContext = macroCondition(isTesting())
    ? () => new OfflineAudioContext(2, 44100 * 10, 44100)
    : () => new AudioContext({ latencyHint: 'interactive' });

  engine: Engine | undefined;
  runner: ProjectRunner | undefined;

  @tracked ready = false;
  @tracked playing = false;
  @tracked private revision = 0;
  @tracked private playheadRevision = 0;

  #booting: Promise<void> | undefined;
  #context: BaseAudioContext | undefined;
  #off: (() => void)[] = [];
  #pending = new Map<
    string,
    { timer: ReturnType<typeof setTimeout>; token: unknown }
  >();

  /** Loads the saved project, makes the engine and runs every script. Safe to call more than once. */
  boot(): Promise<void> {
    this.#booting ??= waitForPromise(this.#boot());
    return this.#booting;
  }

  async #boot(): Promise<void> {
    await this.project.load();
    const context = this.contextFactory();
    this.#context = context;
    const engine = await createEngine({ context });
    if (isDestroying(this)) return;
    this.engine = engine;
    const runner = new ProjectRunner(engine, {
      getDoc: () => this.project.doc,
      dispatch: (op) => this.project.apply(op, { derived: true }),
      changed: () => this.#changed(),
      playheadMoved: () => {
        if (!isDestroying(this)) this.playheadRevision++;
      },
      readFile: async (id) => (await this.project.files.get(id))?.bytes ?? null,
    });
    this.runner = runner;
    this.#off.push(
      this.project.subscribe((change) => this.#onProjectChange(change)),
      engine.transport.on('start', () => (this.playing = true)),
      engine.transport.on('stop', () => (this.playing = false)),
    );
    await runner.start();
    if (!engine.offline) {
      // For poking at the running project from the browser's console, and for the scripts that drive
      // the real app: `euclip.engine.transport.position`, `euclip.project()`.
      Object.assign(window, {
        euclip: { engine, project: () => this.project.doc },
      });
    }
    this.ready = true;
    this.#changed();
  }

  willDestroy(): void {
    super.willDestroy();
    for (const { timer, token } of this.#pending.values()) {
      clearTimeout(timer);
      runWaiter.endAsync(token);
    }
    this.#pending.clear();
    for (const off of this.#off) off();
    this.runner?.dispose();
    this.engine?.dispose();
    const context = this.#context;
    if (context && 'close' in context && context.state !== 'closed') {
      void (context as AudioContext).close();
    }
  }

  // --- Transport ---------------------------------------------------------------------------------

  /** Starts playing. Call from a user gesture: this is where the audio context is allowed to start. */
  play(): void {
    const engine = this.engine;
    if (!engine) {
      // pressed before the engine was ready: start as soon as it is
      void this.boot().then(() => this.engine && this.play());
      return;
    }
    // not awaited: resume() must be called inside the gesture, and the transport starts on the audio
    // clock, which only runs once the context does
    if (!engine.offline) void engine.resume().catch(() => undefined);
    if (engine.transport.state !== 'started') engine.transport.start();
    this.playing = true;
  }

  stop(): void {
    this.engine?.transport.stop();
    this.playing = false;
  }

  toggle(): void {
    if (this.playing) this.stop();
    else this.play();
  }

  // --- What the UI shows ----------------------------------------------------------------------------

  error(scopeId: string): ScriptError | null {
    void this.revision;
    return this.runner?.error(scopeId) ?? null;
  }

  warnings(scopeId: string): DeclarationWarning[] {
    void this.revision;
    return this.runner?.warnings(scopeId) ?? [];
  }

  /** The controls the scope's script declares (not its step grids), in declaration order. */
  controls(scopeId: string): ControlView[] {
    void this.revision;
    return this.runner?.controls(scopeId) ?? [];
  }

  /** Whether a track's script sends anything to its channel bus (so the channel strip has something to act on). */
  sendsToChannel(trackId: string): boolean {
    void this.revision;
    return this.runner?.sendsToChannel(trackId) ?? true;
  }

  /** The waveform editors the scope's script declares. */
  waveforms(scopeId: string): WaveformView[] {
    void this.revision;
    return this.runner?.waveforms(scopeId) ?? [];
  }

  /** A sampler of a scope's script: for drawing its sound and its play position. */
  sampler(scopeId: string, nodeId: string): Node | undefined {
    void this.revision;
    return this.runner?.sampler(scopeId, nodeId);
  }

  /** The project's sounds, as a picker lists them. */
  pool(): PoolEntry[] {
    void this.revision;
    const missing = new Set(this.runner?.missingSamples() ?? []);
    return Object.entries(this.project.doc.samples).map(([name, source]) => {
      const ref = this.engine?.buffers.get(name);
      return {
        name,
        duration: ref?.duration ?? null,
        slices: Math.max(1, (source.slices?.length ?? 2) - 1),
        added: source.file !== undefined,
        label: source.label ?? null,
        state: missing.has(name) ? 'error' : (ref?.state ?? 'loading'),
      };
    });
  }

  /** The audio time that is being heard now (the context's time, less what is still on its way out). */
  get heardTime(): number {
    const context = this.#context;
    if (!context) return 0;
    const latency =
      'outputLatency' in context
        ? (context as AudioContext).outputLatency || 0
        : 0;
    return context.currentTime - latency;
  }

  /** The step grids the scope's script declares, in declaration order. */
  stepGrids(scopeId: string): StepGridView[] {
    void this.revision;
    void this.playheadRevision;
    return this.runner?.stepGrids(scopeId) ?? [];
  }

  // --- What the UI does ------------------------------------------------------------------------------

  /**
   * The user moved a control.
   * @param group the gesture it is part of (one drag): one step to undo, however long it takes
   */
  setControl(
    scopeId: string,
    key: string,
    value: StoredValue,
    group?: string,
  ): void {
    this.project.apply(
      { type: 'setControlValue', scope: scopeId, key, value },
      group === undefined ? {} : { group },
    );
  }

  /** Sets a sound's slices: for every track that plays it. */
  setSlices(name: string, slices: readonly number[], group?: string): void {
    this.project.apply(
      { type: 'setSampleSlices', name, slices },
      group === undefined ? {} : { group },
    );
  }

  /**
   * Plays a sampler for the ear: one slice, or its whole region. Call it from the user's gesture: this
   * is where a context that has not started yet is allowed to. Resolves false when nothing could play
   * (no sound yet, or the browser would not start audio).
   */
  async audition(
    scopeId: string,
    nodeId: string,
    slice?: number,
  ): Promise<boolean> {
    const engine = this.engine;
    if (!engine || !this.runner) return false;
    if (!engine.offline && engine.context.state !== 'running') {
      try {
        await engine.resume();
      } catch {
        return false;
      }
    }
    return this.runner.audition(scopeId, nodeId, slice);
  }

  /**
   * Adds an audio file from the person's device to the pool: checks its size, decodes it (so a file
   * the browser cannot read never gets in), keeps its bytes beside the project, and names it.
   * Resolves the name it was given, or why it was refused.
   */
  async addFile(
    file: File,
  ): Promise<{ name: string; error?: string } | { error: string }> {
    const refused = refusal(file);
    if (refused) return { error: refused };
    const engine = this.engine;
    if (!engine) return { error: 'The audio engine is not ready yet.' };
    let bytes: ArrayBuffer;
    try {
      bytes = await file.arrayBuffer();
    } catch {
      return { error: `"${file.name}" could not be read.` };
    }
    const name = sampleNameFor(
      file.name,
      Object.keys(this.project.doc.samples),
    );
    try {
      // (decoding detaches the bytes it is given: it gets a copy, the store keeps the original)
      await engine.buffers.add(name, bytes.slice(0)).ready;
    } catch {
      engine.buffers.delete(name);
      return {
        error: `"${file.name}" is not audio this browser can decode. WAV, MP3, AAC (m4a), FLAC and Ogg usually work.`,
      };
    }
    const id = newFileId();
    const kept = await this.project.files.put(id, {
      bytes,
      name: file.name,
      type: file.type,
    });
    if (isDestroying(this)) return { error: 'Closed.' };
    this.project.apply({
      type: 'addSample',
      name,
      source: { file: id, label: file.name },
    });
    return kept
      ? { name }
      : {
          name,
          error: `"${file.name}" was added, but could not be kept in this browser's storage: it will be gone after a reload.`,
        };
  }

  /** Forgets a control's value: what the script itself says applies again. */
  resetControl(scopeId: string, key: string): void {
    this.project.apply({ type: 'resetControl', scope: scopeId, key });
  }

  setControlMode(scopeId: string, key: string, mode: string | undefined): void {
    this.project.apply({
      type: 'setControlOptions',
      scope: scopeId,
      key,
      options: { mode },
    });
  }

  toggleStep(scopeId: string, sequence: string, index: number): void {
    const op = this.runner?.toggleStepOperation(scopeId, sequence, index);
    if (op) this.project.apply(op);
  }

  /** Runs a script now instead of after the pause. For tests, and for anything that cannot wait. */
  async runNow(scopeId: string): Promise<void> {
    const pending = this.#pending.get(scopeId);
    if (pending) {
      clearTimeout(pending.timer);
      runWaiter.endAsync(pending.token);
      this.#pending.delete(scopeId);
    }
    await this.runner?.run(scopeId);
  }

  // --- Keeping the engine in step with the document ------------------------------------------------

  #onProjectChange(change: ProjectChange): void {
    const runner = this.runner;
    if (!runner) return;
    if (change.kind === 'replace') {
      void waitForPromise(runner.sync());
      return;
    }
    if (change.op.type === 'setScript') this.#runSoon(change.op.scope);
    // a derived operation records what a script did itself (control.set): the engine is already there
    runner.handle(change.op, change.derived);
  }

  #runSoon(scopeId: string): void {
    const pending = this.#pending.get(scopeId);
    if (pending) {
      clearTimeout(pending.timer);
      runWaiter.endAsync(pending.token);
    }
    const token = runWaiter.beginAsync();
    const timer = setTimeout(() => {
      this.#pending.delete(scopeId);
      const run = this.runner?.run(scopeId) ?? Promise.resolve();
      void run.finally(() => runWaiter.endAsync(token));
    }, RUN_DELAY_MS);
    this.#pending.set(scopeId, { timer, token });
  }

  #changed(): void {
    if (isDestroying(this)) return;
    this.revision++;
    if (this.runner) setLiveCatalog(this.runner.catalog());
  }
}

/** A sound of the project's pool, as a picker lists it. */
export interface PoolEntry {
  name: string;
  /** seconds, once it has loaded */
  duration: number | null;
  /** how many slices it is cut into */
  slices: number;
  /** a file the person added (not one of the built-in sounds) */
  added: boolean;
  /** for an added file: the name it had on the device */
  label: string | null;
  state: 'loading' | 'ready' | 'error';
}

declare module '@ember/service' {
  interface Registry {
    audio: AudioService;
  }
}
