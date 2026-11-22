import Service, { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { isDestroying } from '@ember/destroyable';
import { isTesting, macroCondition } from '@embroider/macros';
import { buildWaiter, waitForPromise } from '@ember/test-waiters';
import { createEngine, type Engine } from 'cracked-up';
import type { Node, NodeTypeInfo } from 'cracked-up';
import type { ChainGraph } from 'client-v2/audio/chain-view';
import {
  ProjectRunner,
  type ControlView,
  type LaneView,
  type ScriptError,
  type StepGridView,
  type WaveformView,
  type SourceView,
} from 'client-v2/audio/runner';
import config from 'client-v2/config/environment';
import { LibraryClient } from 'client-v2/library/client';
import { newTrack } from 'client-v2/project/default-project';
import {
  nameOfSource,
  nameProblem,
  newFileId,
  refusal,
  sampleNameFor,
  sourceId,
  usesOf,
  type SoundUse,
} from 'client-v2/project/pool';
import type { ShelfEntry } from 'client-v2/project/storage';
import { setLiveCatalog } from 'client-v2/editor/live-catalog';
import type { DeclarationWarning } from 'client-v2/controls/declarations';
import type { SampleSource, StoredValue } from 'client-v2/project/schema';
import type ProjectService from 'client-v2/services/project';
import type ChainMetersService from 'client-v2/services/chain-meters';
import type SourceScopeService from 'client-v2/services/source-scope';
import type { ProjectChange } from 'client-v2/services/project';

/**
 * How long after the last edit a script is run again. There is no Run button: the pause is what keeps
 * half-typed code from running.
 */
export const RUN_DELAY_MS = 300;

const runWaiter = buildWaiter('euclip:script-run');

const text = (value: unknown, otherwise: string): string =>
  typeof value === 'string' && value !== '' ? value : otherwise;

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
  @service('chain-meters') declare meters: ChainMetersService;
  @service('source-scope') declare scopes: SourceScopeService;

  /**
   * Makes the audio context. Tests replace this (before `boot`) or get the default below: an
   * OfflineAudioContext, which builds the same graph and never touches the sound card.
   */
  contextFactory: () => BaseAudioContext = macroCondition(isTesting())
    ? () => new OfflineAudioContext(2, 44100 * 10, 44100)
    : () => new AudioContext({ latencyHint: 'interactive' });

  engine: Engine | undefined;
  runner: ProjectRunner | undefined;

  /** The sound library. (Tests put one that answers from fixtures here.) */
  library = new LibraryClient(
    {
      api: text(config.APP['libraryApi'], '/v1'),
      audio: text(config.APP['libraryAudio'], '/library-audio'),
    },
    // (no test reaches the network: by default the library is there and empty)
    macroCondition(isTesting())
      ? () =>
          Promise.resolve(
            new Response('{"dirs":[],"audio":[],"path":"/"}', { status: 200 }),
          )
      : undefined,
  );

  /** The sound being heard from the browser (its `soundId`), and how far that has got. */
  @tracked hearing: { id: string; state: 'loading' | 'playing' } | null = null;
  /** The last sound that could not be heard or used, and why: shown on its row until tried again. */
  @tracked failed: { id: string; message: string } | null = null;
  /** bumped when the person's shelf changes (a file added, supplied again) */
  @tracked shelfRevision = 0;
  #hearTimer: ReturnType<typeof setTimeout> | undefined;
  #hearToken = 0;

  @tracked ready = false;
  @tracked playing = false;
  @tracked private revision = 0;
  @tracked private playheadRevision = 0;

  #booting: Promise<void> | undefined;
  #context: BaseAudioContext | undefined;
  #off: (() => void)[] = [];
  readonly #stepListeners = new Set<(scopeId: string) => void>();

  /**
   * Hears every step that sounds, with the scope it is in, as it is heard. For things that show it by
   * hand (the track rail's blink): nothing tracked changes, so nothing is drawn again per step.
   */
  onStepTriggered(listener: (scopeId: string) => void): () => void {
    this.#stepListeners.add(listener);
    return () => this.#stepListeners.delete(listener);
  }
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
      stepTriggered: (scopeId) => {
        for (const listener of this.#stepListeners) listener(scopeId);
      },
      readFile: async (id) => (await this.project.files.get(id))?.bytes ?? null,
      libraryUrl: (path) => this.library.audioUrl(path),
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
        euclip: {
          engine,
          project: () => this.project.doc,
          meters: this.meters,
        },
      });
    }
    this.ready = true;
    this.#changed();
  }

  willDestroy(): void {
    super.willDestroy();
    clearTimeout(this.#hearTimer);
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
    this.meters.poke();
    this.scopes.poke();
  }

  /**
   * Stops everything: the sequencer stops, and the rest of the sound (looping samplers, held notes,
   * delay and reverb tails) fades out quickly and is cut (`ProjectRunner.silence`). View state: no
   * undo step, nothing written to the project.
   */
  stop(): void {
    if (this.runner) this.runner.silence();
    else this.engine?.transport.stop();
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

  /** The graph the scope's running script made, as rows for the Signal chain tab. Null until it has built. */
  chainGraph(scopeId: string): ChainGraph | null {
    void this.revision;
    return this.runner?.chainGraph(scopeId) ?? null;
  }

  /** A number parameter's base value on a node of a scope's script; undefined when there is none. */
  paramValue(
    scopeId: string,
    nodeId: string,
    param: string,
  ): number | undefined {
    void this.revision;
    return this.runner?.paramValue(scopeId, nodeId, param);
  }

  /** A node of a scope's running script, by id. Not tracked: for the meters, which look again every frame. */
  /** What leaves a track's channel strip (post fader), for its meter. */
  channelOutput(trackId: string): AudioNode | null {
    return this.runner?.channelOutput(trackId) ?? null;
  }

  nodeById(scopeId: string, nodeId: string): Node | undefined {
    return this.runner?.nodeById(scopeId, nodeId);
  }

  /** The node types the library offers. */
  nodeTypes(): readonly NodeTypeInfo[] {
    return this.runner?.nodeTypes() ?? [];
  }

  /** The waveform editors the scope's script declares. */
  waveforms(scopeId: string): WaveformView[] {
    void this.revision;
    return this.runner?.waveforms(scopeId) ?? [];
  }

  /** Every source editor the scope's script declares (waveforms and synths), in declaration order. */
  sources(scopeId: string): SourceView[] {
    void this.revision;
    return this.runner?.sources(scopeId) ?? [];
  }

  /**
   * What a track is called when the person has not named it: the file its first source plays (its name
   * without folder or extension: "Snare"), else that source's node type ("polysynth"). Null when the
   * script has no source editor, or has not run yet.
   */
  autoTrackName(scopeId: string): string | null {
    const first = this.sources(scopeId)[0];
    if (!first) return null;
    if (first.kind === 'synth') return first.synth.type;
    const key = first.waveform.sound?.key;
    if (key === undefined) return 'sampler';
    const source = this.project.doc.samples[key];
    const file = source?.label ?? source?.library ?? key;
    return fileTitle(file) || key;
  }

  /** A track's name as shown: the person's, else the automatic one, else "Track 3". */
  trackName(track: { id: string; name: string }, order: number): string {
    return (
      track.name.trim() || this.autoTrackName(track.id) || `Track ${order}`
    );
  }

  /** The controls of one source node, for the source tab. */
  sourceControls(scopeId: string, nodeId: string): ControlView[] {
    void this.revision;
    return this.runner?.sourceControls(scopeId, nodeId) ?? [];
  }

  /**
   * Starts a note on a source for the ear and holds it until `releaseNote`. Call it from the user's
   * gesture, where a context that has not started is allowed to. Resolves whether anything was triggered.
   */
  async playNote(
    scopeId: string,
    nodeId: string,
    note: { midi: number; hz: number; param: string | null },
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
    const played = this.runner.playNote(scopeId, nodeId, note);
    this.scopes.poke();
    return played;
  }

  releaseNote(scopeId: string, nodeId: string): void {
    this.runner?.releaseNote(scopeId, nodeId);
  }

  /** A sampler of a scope's script: for drawing its sound and its play position. */
  sampler(scopeId: string, nodeId: string): Node | undefined {
    void this.revision;
    return this.runner?.sampler(scopeId, nodeId);
  }

  /** The project's sounds, as a picker lists them. */
  pool(): PoolEntry[] {
    void this.revision;
    const doc = this.project.doc;
    const failed = new Set(this.runner?.missingSamples() ?? []);
    const missing = new Set(this.runner?.missingFiles() ?? []);
    return Object.entries(doc.samples).map(([name, source]) => {
      const ref = this.engine?.buffers.get(name);
      return {
        name,
        duration: ref?.duration ?? null,
        slices: Math.max(1, (source.slices?.length ?? 2) - 1),
        added: source.file !== undefined,
        from:
          source.library !== undefined
            ? 'library'
            : source.file !== undefined
              ? 'mine'
              : 'built-in',
        source: sourceId(source),
        label: source.label ?? source.library ?? null,
        state: missing.has(name)
          ? 'missing'
          : failed.has(name)
            ? 'error'
            : (ref?.state ?? 'loading'),
        uses: usesOf(doc, name),
      };
    });
  }

  // --- Sounds: the library, the person's own, the project's ------------------------------------------

  /** The person's own sounds: the shelf, whichever projects use them. */
  async shelf(): Promise<ShelfEntry[]> {
    void this.shelfRevision;
    return this.project.files.list();
  }

  /** What a sound would be in the project: where it comes from, and a label to keep with it. */
  #sourceOf(sound: SoundRef): SampleSource | null {
    if (sound.kind === 'library') {
      return { library: sound.path, label: sound.name };
    }
    if (sound.kind === 'mine') return { file: sound.id, label: sound.name };
    return this.project.doc.samples[sound.name] ?? null;
  }

  /** The project sound a browser's sound is, when it is one already. */
  projectNameOf(sound: SoundRef): string | undefined {
    if (sound.kind === 'project') return sound.name;
    const source = this.#sourceOf(sound);
    return source
      ? nameOfSource(this.project.doc.samples, sourceId(source))
      : undefined;
  }

  /**
   * Adds a sound to the project, without giving it to anything. A source that is in the project
   * already is not added twice: its name is returned. The name is made from the file's (pool.ts).
   */
  addToProject(sound: SoundRef, group?: string): string | undefined {
    const known = this.projectNameOf(sound);
    if (known !== undefined) return known;
    const source = this.#sourceOf(sound);
    if (!source || sound.kind === 'project') return undefined;
    const name = sampleNameFor(
      sound.name,
      Object.keys(this.project.doc.samples),
    );
    this.project.apply(
      { type: 'addSample', name, source },
      group === undefined ? {} : { group },
    );
    return name;
  }

  /**
   * Use: the sound joins the project if it has not, and the sampler aimed at plays it. One step to
   * undo. Resolves the project sound's name.
   */
  async useSound(
    sound: SoundRef,
    target: { scopeId: string; soundKey: string },
  ): Promise<string | undefined> {
    const id = soundId(sound);
    if (sound.kind === 'mine' && this.projectNameOf(sound) === undefined) {
      // One of the person's files is decoded before it joins: a sampler given a name with no audio
      // behind it yet would look for it elsewhere. (A library file's entry is there from the start.)
      try {
        await this.#audioOf(sound);
      } catch (error) {
        this.failed = {
          id,
          message: error instanceof Error ? error.message : String(error),
        };
        return undefined;
      }
      if (isDestroying(this)) return undefined;
    }
    const group = `use-${++this.#uses}`;
    const name = this.addToProject(sound, group);
    if (name === undefined) return undefined;
    this.project.apply(
      {
        type: 'setControlValue',
        scope: target.scopeId,
        key: target.soundKey,
        value: name,
      },
      { group },
    );
    return name;
  }
  #uses = 0;

  /**
   * Create New Tracks from: one new sampler track per sound, each playing its sound and named after
   * it, all in one step to undo. The person's own files are read first, as Use reads them. Resolves
   * the new tracks' ids, in order (none when a file could not be read: then nothing was added).
   */
  async newTracksFrom(sounds: readonly SoundRef[]): Promise<string[]> {
    for (const sound of sounds) {
      if (sound.kind !== 'mine' || this.projectNameOf(sound) !== undefined)
        continue;
      try {
        await this.#audioOf(sound);
      } catch (error) {
        this.failed = {
          id: soundId(sound),
          message: error instanceof Error ? error.message : String(error),
        };
        return [];
      }
      if (isDestroying(this)) return [];
    }
    const group = `tracks-${++this.#uses}`;
    const ids: string[] = [];
    for (const sound of sounds) {
      const name = this.addToProject(sound, group);
      if (name === undefined) continue;
      // (unnamed: it is called after its sound, and follows it if the sound is changed)
      const track = newTrack('', name);
      this.project.apply({ type: 'addTrack', track }, { group });
      ids.push(track.id);
    }
    return ids;
  }

  /**
   * Hear: plays a sound for the ear and changes nothing. A second call for the sound that is playing
   * stops it; a call for another replaces it. Library audio is fetched here, the first time, and
   * decoded once: using the sound afterwards does not fetch or decode it again.
   */
  async hear(sound: SoundRef): Promise<void> {
    const id = soundId(sound);
    const engine = this.engine;
    const runner = this.runner;
    if (!engine || !runner) return;
    if (this.hearing?.id === id) {
      this.stopHearing();
      return;
    }
    this.stopHearing();
    const token = ++this.#hearToken;
    this.hearing = { id, state: 'loading' };
    if (this.failed?.id === id) this.failed = null;
    try {
      if (!engine.offline && engine.context.state !== 'running') {
        await engine.resume();
      }
      const buffer = await this.#audioOf(sound);
      if (token !== this.#hearToken || isDestroying(this)) return;
      await runner.hear(buffer);
      if (token !== this.#hearToken || isDestroying(this)) return;
      this.hearing = { id, state: 'playing' };
      this.#hearTimer = setTimeout(
        () => {
          if (token === this.#hearToken && !isDestroying(this)) {
            this.hearing = null;
          }
        },
        Math.min(buffer.duration, 60) * 1000 + 50,
      );
    } catch (error) {
      if (token !== this.#hearToken || isDestroying(this)) return;
      this.hearing = null;
      this.failed = {
        id,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  stopHearing(): void {
    this.#hearToken++;
    clearTimeout(this.#hearTimer);
    this.runner?.stopHearing();
    this.hearing = null;
  }

  /** The decoded audio of a sound: from the project, from what has been decoded, or fetched and decoded now. */
  async #audioOf(sound: SoundRef): Promise<AudioBuffer> {
    const engine = this.engine!;
    const runner = this.runner!;
    if (sound.kind === 'project') {
      const ref = engine.buffers.get(sound.name);
      if (!ref)
        throw new Error(`'${sound.name}' has no audio in this project.`);
      return ref.ready;
    }
    const source = sourceId(this.#sourceOf(sound)!);
    const known = runner.decoded(source);
    if (known) return known;
    let bytes: ArrayBuffer;
    if (sound.kind === 'library') {
      let response: Response;
      try {
        response = await fetch(this.library.audioUrl(sound.path));
      } catch {
        throw new Error(
          'Could not be fetched. Check the connection and try again.',
        );
      }
      if (!response.ok) {
        throw new Error(`Could not be fetched (${response.status}).`);
      }
      bytes = await response.arrayBuffer();
    } else {
      const file = await this.project.files.get(sound.id);
      if (!file) throw new Error('The file is not in this browser any more.');
      bytes = file.bytes;
    }
    let decoded: AudioBuffer;
    try {
      // (decoding detaches the bytes it is given: it gets a copy)
      decoded = await engine.context.decodeAudioData(bytes.slice(0));
    } catch {
      throw new Error('This browser cannot decode it.');
    }
    runner.keepDecoded(source, decoded);
    return decoded;
  }

  /**
   * Puts an audio file from the person's device on their shelf ("My sounds"): checks its size, decodes
   * it (so a file the browser cannot read never gets in), and keeps its bytes in this browser. It is
   * not in any project until it is used or added.
   */
  async shelveFile(
    file: File,
    id = newFileId(),
  ): Promise<{ id: string; name: string; error?: string } | { error: string }> {
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
    try {
      const decoded = await engine.context.decodeAudioData(bytes.slice(0));
      this.runner?.keepDecoded(`file:${id}`, decoded);
    } catch {
      return {
        error: `"${file.name}" is not audio this browser can decode. WAV, MP3, AAC (m4a), FLAC and Ogg usually work.`,
      };
    }
    const kept = await this.project.files.put(id, {
      bytes,
      name: file.name,
      type: file.type,
      added: Date.now(),
    });
    if (isDestroying(this)) return { error: 'Closed.' };
    this.shelfRevision++;
    return kept
      ? { id, name: file.name }
      : {
          id,
          name: file.name,
          error: `"${file.name}" was added, but could not be kept in this browser's storage: it will be gone after a reload.`,
        };
  }

  /** A project sound's file is missing from this browser: the person gives it again, under the same key. */
  async supplyFile(name: string, file: File): Promise<string | null> {
    const source = this.project.doc.samples[name];
    if (source?.file === undefined)
      return 'That sound is not one of your files.';
    const result = await this.shelveFile(file, source.file);
    if (!('id' in result)) return result.error;
    await this.runner?.retrySample(name);
    return result.error ?? null;
  }

  /** Tries again to load a project sound that failed. */
  retrySound(name: string): void {
    void this.runner?.retrySample(name);
  }

  removeSound(name: string): void {
    this.project.apply({ type: 'removeSample', name });
  }

  /** Why a project sound cannot be called this; null when it can. */
  soundNameProblem(name: string, except?: string): string | null {
    return nameProblem(
      name,
      Object.keys(this.project.doc.samples).filter((other) => other !== except),
    );
  }

  /** Renames a project sound; with `scripts`, every script that names it is rewritten too (one step to undo). */
  renameSound(from: string, to: string, scripts: boolean): void {
    this.project.apply({ type: 'renameSample', from, to, scripts });
  }

  /** The same source under a second name, with slices of its own. Resolves the new name. */
  duplicateSound(name: string): string {
    const as = sampleNameFor(name, Object.keys(this.project.doc.samples));
    this.project.apply({ type: 'duplicateSample', name, as });
    return as;
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
   * Adds an audio file from the person's device straight to the project: onto their shelf, then into
   * the pool under a name made from the file's. Resolves the name it was given, or why it was refused.
   */
  async addFile(
    file: File,
  ): Promise<{ name: string; error?: string } | { error: string }> {
    const shelved = await this.shelveFile(file);
    if (!('id' in shelved)) return shelved;
    const name = this.addToProject({
      kind: 'mine',
      id: shelved.id,
      name: shelved.name,
    });
    if (name === undefined) return { error: 'It could not be added.' };
    return shelved.error === undefined
      ? { name }
      : { name, error: shelved.error };
  }

  /** Forgets a control's value: what the script itself says applies again. */
  resetControl(scopeId: string, key: string, group?: string): void {
    this.project.apply(
      { type: 'resetControl', scope: scopeId, key },
      group === undefined ? {} : { group },
    );
  }

  /**
   * Chooses a unit from a control's menu: one step to undo, whatever it takes (a speed going into or
   * out of "sequence sync" has its number changed with its unit).
   */
  chooseControlMode(scopeId: string, key: string, choice: string): void {
    const operations = this.runner?.modeOperations(scopeId, key, choice) ?? [];
    const group = `unit-${scopeId}-${key}-${++this.#unitChoices}`;
    for (const operation of operations)
      this.project.apply(operation, { group });
  }
  #unitChoices = 0;

  /**
   * A pattern generator wrote a grid's pattern: the steps, and the dials that made them (kept so the
   * panel reopens where it was). One step to undo with whatever else is in the gesture.
   */
  setPattern(
    scopeId: string,
    key: string,
    steps: readonly number[],
    generator: object | undefined,
    group: string,
  ): void {
    this.project.apply(
      { type: 'setControlValue', scope: scopeId, key, value: [...steps] },
      { group },
    );
    if (generator !== undefined) {
      this.project.apply(
        {
          type: 'setControlOptions',
          scope: scopeId,
          key,
          options: { generator: { ...generator } },
        },
        { group },
      );
    }
  }

  /** The lanes of a sequence: every control whose lane follows it, in play or not. */
  lanes(scopeId: string, sequence: string): LaneView[] {
    void this.revision;
    return this.runner?.lanes(scopeId, sequence) ?? [];
  }

  /** Every step of a lane back to following the single value: one step to undo. */
  resetLane(scopeId: string, key: string): void {
    const operation = this.runner?.laneResetOperation(scopeId, key);
    if (operation) this.project.apply(operation);
  }

  /**
   * A lane's Reset: the control and every step back to the script's (the control's value forgotten,
   * every step following it again). One step to undo.
   */
  resetLaneAndControl(scopeId: string, key: string): void {
    const group = `reset-lane-${++this.#unitChoices}`;
    const operation = this.runner?.laneResetOperation(scopeId, key);
    if (operation) this.project.apply(operation, { group });
    this.resetControl(scopeId, key, group);
  }

  /**
   * One step of a lane given a value of its own, or (null) back to following the single value: with a
   * `group`, part of a gesture that is one step to undo.
   */
  setLaneValue(
    scopeId: string,
    key: string,
    index: number,
    value: number | boolean | null,
    group?: string,
  ): void {
    const operation = this.runner?.laneOperation(scopeId, key, index, value);
    if (operation) {
      this.project.apply(operation, group === undefined ? {} : { group });
    }
  }

  /** A lane follows another sequence of the script: one step to undo. */
  setLaneSequence(scopeId: string, key: string, sequence: string): void {
    const operation = this.runner?.laneSequenceOperation(
      scopeId,
      key,
      sequence,
    );
    if (operation) this.project.apply(operation);
  }

  /** Sets a grid's length or step length (the project's, over the script's); undefined forgets it. */
  setGridShape(
    scopeId: string,
    key: string,
    shape: { length?: number | undefined; step?: string | undefined },
    group?: string,
  ): void {
    this.project.apply(
      { type: 'setControlOptions', scope: scopeId, key, options: shape },
      group === undefined ? {} : { group },
    );
  }

  /** A grid back to the script's: its pattern, its length and its step length. One step to undo. */
  resetGrid(scopeId: string, key: string): void {
    const group = `reset-grid-${++this.#unitChoices}`;
    this.project.apply(
      {
        type: 'setControlOptions',
        scope: scopeId,
        key,
        options: { length: undefined, step: undefined },
      },
      { group },
    );
    this.project.apply(
      { type: 'resetControl', scope: scopeId, key },
      { group },
    );
  }

  /** Sets how long a control's parameter takes to get where the control is put; undefined forgets it (the script's applies). */
  setControlGlide(
    scopeId: string,
    key: string,
    seconds: number | undefined,
    group?: string,
  ): void {
    this.project.apply(
      {
        type: 'setControlOptions',
        scope: scopeId,
        key,
        options: { glide: seconds },
      },
      group === undefined ? {} : { group },
    );
  }

  setControlMode(
    scopeId: string,
    key: string,
    mode: string | undefined,
    group?: string,
  ): void {
    this.project.apply(
      { type: 'setControlOptions', scope: scopeId, key, options: { mode } },
      group === undefined ? {} : { group },
    );
  }

  /** @param group the gesture it is part of (the two clicks of a double click): one step to undo */
  toggleStep(
    scopeId: string,
    sequence: string,
    index: number,
    group?: string,
  ): void {
    const op = this.runner?.toggleStepOperation(scopeId, sequence, index);
    if (op) this.project.apply(op, group === undefined ? {} : { group });
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
    this.meters.poke();
    this.scopes.poke();
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
  /** where it comes from: the library, the person's own files, or the app's built-in sounds */
  from: 'library' | 'mine' | 'built-in';
  /** its source as one string (pool.ts `sourceId`) */
  source: string;
  /** for an added file: the name it had on the device; for a library file: its path there */
  label: string | null;
  /** `missing`: one of the person's files that is not in this browser; `error`: it would not load or decode */
  state: 'loading' | 'ready' | 'error' | 'missing';
  /** the tracks (and the project script) that use it */
  uses: SoundUse[];
}

/** A sound as the browser offers it: a file of the library, one of the person's own, or a project sound. */
export type SoundRef =
  | { kind: 'library'; path: string; name: string }
  | { kind: 'mine'; id: string; name: string }
  | { kind: 'project'; name: string };

/** One string per sound a browser can show: for "which row is playing". */
export function soundId(sound: SoundRef): string {
  return sound.kind === 'library'
    ? `library:${sound.path}`
    : sound.kind === 'mine'
      ? `file:${sound.id}`
      : `project:${sound.name}`;
}

declare module '@ember/service' {
  interface Registry {
    audio: AudioService;
  }
}

/** A file's name without its folder or extension: "/Roland/TR-808/Snare.wav" is "Snare". */
export function fileTitle(path: string): string {
  const base = path.slice(path.lastIndexOf('/') + 1);
  const dot = base.lastIndexOf('.');
  return dot > 0 ? base.slice(0, dot) : base;
}
