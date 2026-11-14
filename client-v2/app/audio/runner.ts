/**
 * Runs a project on a cracked-up engine and keeps the two in step.
 *
 *   project script  -> the engine's root scope
 *   each track      -> a child scope named by the track's id, with a host-made `out` bus (the channel
 *                      strip: level and pan) routed to `main`
 *
 * A script is run with `scope.build`, so re-running changed code only applies the difference, and code
 * that fails leaves the previous version playing. After every run the runner settles the step patterns
 * the user has edited against the script's (see `#applyValues`).
 *
 * Parameter controls are not derived here: how a script declares a control is being redesigned. What a
 * rebuild does to a parameter the host has set is recorded in the tests (runner-test.ts).
 *
 * This is a plain class with no Ember in it: the audio service owns one for the live engine, and tests
 * make their own on an OfflineAudioContext.
 */
import type {
  Engine,
  Node,
  Scope,
  ScopeApi,
  Sequence,
  SequenceEvent,
} from 'cracked-up';
import { compile, type Program } from 'client-v2/audio/compile';
import type { Operation } from 'client-v2/project/operations';
import {
  PROJECT_SCOPE,
  type ProjectDocument,
  type ScopeValues,
  type TrackDocument,
} from 'client-v2/project/schema';

/** The pan insert Euclip puts on every track's `out` bus. Not shown among the track's nodes. */
export const HOST_PAN_ID = 'euclip-pan';
/** The bus Euclip makes in every track's scope: the track's way out, through its channel strip. */
export const OUT_BUS = 'out';
export interface ScriptError {
  /** `SyntaxError: ...`, as the demo words it */
  message: string;
  /** when the error came from a sequence's callback: which one. That callback is disabled. */
  sequence?: string;
  /** the thrown value, for the editor to place on a line when it can */
  cause: unknown;
}

export interface SequenceView {
  name: string;
  /** the live pattern */
  steps: number[];
  /** the pattern the script gave on its last run */
  code: number[];
  overridden: boolean;
  /** the step last heard, or null when stopped */
  playhead: number | null;
  /** its callback threw and has been switched off until the script runs again */
  disabled: boolean;
}

/** The names the editors' catalog is given from the live project. */
export interface LiveCatalog {
  buffers: string[];
  ids: string[];
  buses: string[];
  sequences: string[];
}

export interface RunnerHost {
  /** The current document. */
  getDoc(): ProjectDocument;
  /** Applies an operation the runner derived (dropping an override the script has overtaken). */
  dispatch(op: Operation): void;
  /** Something the UI shows has changed: sequences, patterns, errors. */
  changed(): void;
  /** A playhead moved. Separate, because it happens on every step. */
  playheadMoved(): void;
}

interface SequenceRuntime {
  disabled: boolean;
}

interface ScopeRuntime {
  id: string;
  scope: Scope;
  /** the text most recently attempted, so a run with nothing new does nothing */
  lastTried: string | null;
  /** whether any version is running */
  built: boolean;
  error: ScriptError | null;
  /** the named sequences of the version that is running, in the order the script made them */
  sequences: Map<string, SequenceRuntime>;
  /** the pattern the script gave each named sequence on its last run */
  codeSteps: Map<string, number[]>;
  /** what a step held before it was switched off, so switching it on again brings that back */
  stepMemory: Map<string, number[]>;
  playheads: Map<string, number>;
  off: (() => void)[];
}

function describeError(error: unknown, sequence?: string): ScriptError {
  // a failed build wraps what the code threw; the original says more (ReferenceError, TypeError)
  const original =
    error instanceof Error && error.cause instanceof Error
      ? error.cause
      : error;
  const message =
    original instanceof Error
      ? `${original.name}: ${original.message}`
      : String(original);
  return { message, cause: original, ...(sequence ? { sequence } : {}) };
}

function sameSteps(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((value, i) => value === b[i]);
}

function valuesOf(doc: ProjectDocument, scopeId: string): ScopeValues | null {
  if (scopeId === PROJECT_SCOPE) return doc.values;
  return doc.tracks.find((track) => track.id === scopeId)?.values ?? null;
}

function scriptOf(doc: ProjectDocument, scopeId: string): string | null {
  if (scopeId === PROJECT_SCOPE) return doc.script;
  return doc.tracks.find((track) => track.id === scopeId)?.script ?? null;
}

export class ProjectRunner {
  readonly engine: Engine;
  readonly #host: RunnerHost;
  readonly #scopes = new Map<string, ScopeRuntime>();
  readonly #off: (() => void)[] = [];
  #loadedSamples = new Map<string, string>();

  constructor(engine: Engine, host: RunnerHost) {
    this.engine = engine;
    this.#host = host;
    // Playheads move when a step is heard, not when its callback runs (which is ahead of the sound).
    this.#off.push(
      engine.transport.onDisplay((event) => this.#display(event)),
      engine.transport.on('stop', () => this.#clearPlayheads()),
      engine.on('error', (error) => {
        // A sequence callback that throws is caught here in the runner (see #guard). What is left is
        // trouble outside any script's run, such as a sound that would not load.
        console.warn('Euclip: the audio engine reported an error.', error);
      }),
    );
  }

  /** Loads the pool and runs every script: the project's first, then each track's. */
  async start(): Promise<void> {
    const doc = this.#host.getDoc();
    this.engine.transport.bpm = doc.bpm;
    this.#loadSamples(doc);
    await this.run(PROJECT_SCOPE);
    for (const track of doc.tracks) await this.run(track.id);
  }

  dispose(): void {
    for (const off of this.#off) off();
    for (const runtime of this.#scopes.values()) {
      for (const off of runtime.off) off();
    }
    this.#scopes.clear();
  }

  // --- Running scripts ---------------------------------------------------------------------------

  /**
   * Runs a scope's script as it is in the document now. A syntax error, or a throw while building,
   * leaves the version that was running untouched and records the error.
   */
  async run(scopeId: string): Promise<void> {
    const doc = this.#host.getDoc();
    const code = scriptOf(doc, scopeId);
    if (code === null) return;
    const runtime = this.#runtime(scopeId);
    if (code === runtime.lastTried) return;
    runtime.lastTried = code;

    // Compile first. A syntax error touches nothing.
    let program: Program;
    try {
      program = compile(code);
    } catch (error) {
      runtime.error = describeError(error);
      this.#host.changed();
      return;
    }

    const sequences = new Map<string, SequenceRuntime>();
    const track = doc.tracks.find((candidate) => candidate.id === scopeId);
    try {
      const result = await runtime.scope.build((api) => {
        if (track) this.#channelStrip(api, track);
        program(this.#guard(api, runtime, sequences));
      });
      runtime.built = true;
      runtime.sequences = sequences;
      // One bad node does not stop the rest of a build applying: what could be built is now running.
      runtime.error = result.errors[0] ? describeError(result.errors[0]) : null;
      this.#readCode(runtime);
      this.#applyValues(runtime, true);
    } catch (error) {
      // The version that was running is untouched.
      runtime.error = describeError(error);
    }
    this.#host.changed();
  }

  /** Brings the engine in line with a document that was replaced whole (loaded, undone, redone). */
  async sync(): Promise<void> {
    const doc = this.#host.getDoc();
    this.engine.transport.bpm = doc.bpm;
    this.#loadSamples(doc);
    for (const id of [...this.#scopes.keys()]) {
      if (
        id !== PROJECT_SCOPE &&
        !doc.tracks.some((track) => track.id === id)
      ) {
        this.#remove(id);
      }
    }
    for (const id of [PROJECT_SCOPE, ...doc.tracks.map((track) => track.id)]) {
      const runtime = this.#runtime(id);
      if (scriptOf(doc, id) !== runtime.lastTried) await this.run(id);
      else this.#applyValues(runtime, false);
    }
    for (const track of doc.tracks) this.#applyStrip(track);
    this.#host.changed();
  }

  /** Applies one operation to the engine. The document has already changed. */
  handle(op: Operation): void {
    const doc = this.#host.getDoc();
    switch (op.type) {
      case 'setBpm':
        this.engine.transport.bpm = doc.bpm;
        break;
      case 'setSteps':
        this.#sequence(op.scope, op.sequence)?.update({ steps: op.steps });
        break;
      case 'clearSteps': {
        const code = this.#scopes.get(op.scope)?.codeSteps.get(op.sequence);
        if (code)
          this.#sequence(op.scope, op.sequence)?.update({ steps: code });
        break;
      }
      case 'setTrackLevel':
      case 'setTrackPan': {
        const track = doc.tracks.find((candidate) => candidate.id === op.id);
        if (track) this.#applyStrip(track);
        break;
      }
      case 'addTrack':
        void this.run(op.track.id);
        break;
      case 'removeTrack':
        this.#remove(op.id);
        break;
      case 'setSample':
      case 'removeSample':
        this.#loadSamples(doc);
        break;
      case 'setScript':
      case 'renameTrack':
      case 'setProjectName':
        // a script is run by whoever owns the pause after typing (see services/audio.ts)
        break;
    }
    this.#host.changed();
  }

  // --- What the UI shows --------------------------------------------------------------------------

  error(scopeId: string): ScriptError | null {
    return this.#scopes.get(scopeId)?.error ?? null;
  }

  /** Whether the scope has a version running. False for a script that has never built. */
  isBuilt(scopeId: string): boolean {
    return this.#scopes.get(scopeId)?.built ?? false;
  }

  /** The scope's named sequences, in the order the script made them. */
  sequences(scopeId: string): SequenceView[] {
    const runtime = this.#scopes.get(scopeId);
    if (!runtime) return [];
    const values = valuesOf(this.#host.getDoc(), scopeId);
    const views: SequenceView[] = [];
    for (const [name, state] of runtime.sequences) {
      const sequence = runtime.scope.transport.get(name);
      if (!sequence) continue;
      const steps = [...sequence.steps];
      const code = runtime.codeSteps.get(name) ?? steps;
      const override = values?.sequences[name];
      views.push({
        name,
        steps,
        code,
        overridden: override !== undefined && !sameSteps(override.value, code),
        playhead: runtime.playheads.get(name) ?? null,
        disabled: state.disabled,
      });
    }
    return views;
  }

  /** What the editors' catalog is to offer from the live project. */
  catalog(): LiveCatalog {
    const ids = new Set<string>();
    const buses = new Set<string>([OUT_BUS]);
    const sequences = new Set<string>();
    for (const runtime of this.#scopes.values()) {
      for (const node of this.#ownNodes(runtime)) ids.add(node.id);
      for (const bus of runtime.scope.snapshot().buses) buses.add(bus.name);
      for (const name of runtime.sequences.keys()) sequences.add(name);
    }
    return {
      buffers: Object.keys(this.#host.getDoc().samples),
      ids: [...ids],
      buses: [...buses],
      sequences: [...sequences],
    };
  }

  // --- Operations the UI asks for: built here because they need the pattern the script last gave ----

  /**
   * The operation for pressing a step. An on step goes off; an off step comes back to what it held
   * before (so a step holding 3 is not flattened to 1), or to the script's value, or to 1.
   */
  toggleStepOperation(
    scopeId: string,
    name: string,
    index: number,
  ): Operation | null {
    const runtime = this.#scopes.get(scopeId);
    const sequence = this.#sequence(scopeId, name);
    if (!runtime || !sequence || index < 0 || index >= sequence.steps.length) {
      return null;
    }
    const steps = [...sequence.steps];
    const code = runtime.codeSteps.get(name) ?? steps;
    const memory = runtime.stepMemory.get(name) ?? [];
    const current = steps[index] ?? 0;
    if (current !== 0) {
      memory[index] = current;
      steps[index] = 0;
    } else {
      steps[index] = memory[index] || code[index] || 1;
    }
    runtime.stepMemory.set(name, memory);
    return {
      type: 'setSteps',
      scope: scopeId,
      sequence: name,
      steps,
      code: [...code],
    };
  }

  // --- Last touched wins ---------------------------------------------------------------------------

  /**
   * Straight after a successful run: notes the pattern the script gave each named sequence. (A rebuild
   * puts a named sequence back to the script's pattern, so this is the moment to read it.)
   */
  #readCode(runtime: ScopeRuntime): void {
    runtime.codeSteps = new Map();
    for (const name of runtime.sequences.keys()) {
      const sequence = runtime.scope.transport.get(name);
      if (sequence) runtime.codeSteps.set(name, [...sequence.steps]);
    }
  }

  /**
   * Settles every named sequence against the pattern the script last gave it:
   *   - no stored pattern: the script's.
   *   - a stored pattern whose `code` is still what the script gives: the user edited it last, so the
   *     stored pattern is applied (again).
   *   - a stored pattern whose `code` is no longer what the script gives: the script was edited last.
   *     After a run (`drop`) the stored pattern is removed from the document; the script's stands.
   *   - a stored pattern for a sequence that is not there: left alone, in case it returns.
   */
  #applyValues(runtime: ScopeRuntime, drop: boolean): void {
    const values = valuesOf(this.#host.getDoc(), runtime.id);
    const dropped: Operation[] = [];
    for (const name of runtime.sequences.keys()) {
      const sequence = runtime.scope.transport.get(name);
      const code = runtime.codeSteps.get(name);
      if (!sequence || !code) continue;
      const override = values?.sequences[name];
      let target = code;
      if (override) {
        if (sameSteps(override.code, code)) target = override.value;
        else if (drop)
          dropped.push({
            type: 'clearSteps',
            scope: runtime.id,
            sequence: name,
          });
      }
      if (!sameSteps(sequence.steps, target))
        sequence.update({ steps: target });
    }
    for (const op of dropped) this.#host.dispatch(op);
  }

  // --- A track's way out ----------------------------------------------------------------------------

  /**
   * The host's part of every track build: the pan insert on the track's `out` bus. It is made inside
   * the build because a build leaves a bus with exactly the inserts that build asked for; an insert
   * added from outside would be removed by the script's next run. The bus itself is made once, outside
   * (see #runtime), and does survive rebuilds.
   */
  #channelStrip(api: ScopeApi, track: TrackDocument): void {
    api.bus(OUT_BUS).insert().panner({ id: HOST_PAN_ID, pan: track.pan });
  }

  #applyStrip(track: TrackDocument): void {
    const runtime = this.#scopes.get(track.id);
    if (!runtime) return;
    runtime.scope.bus(OUT_BUS).gain.set(track.level);
    const pan = [...runtime.scope.select(`#${HOST_PAN_ID}`)].find(
      (node) => node.scope === runtime.scope,
    );
    pan?.param('pan').set(track.pan);
  }

  // --- Sequences: names, errors, playheads --------------------------------------------------------

  /**
   * The `__` a script is given: the scope's own, with its transport wrapped so that the runner learns
   * which named sequences the script makes, and so that a callback that throws is switched off and
   * reported against this script instead of throwing on every step.
   */
  #guard(
    api: ScopeApi,
    runtime: ScopeRuntime,
    sequences: Map<string, SequenceRuntime>,
  ): ScopeApi {
    const guarded =
      <E>(
        label: string,
        state: SequenceRuntime,
        callback: (event: E) => void,
      ) =>
      (event: E): void => {
        if (state.disabled) return;
        try {
          callback(event);
        } catch (error) {
          state.disabled = true;
          runtime.error = describeError(error, label);
          this.#host.changed();
        }
      };
    const real = api.transport;
    const transport = new Proxy(real, {
      get: (target, property) => {
        if (property === 'sequence' || property === 'steps') {
          return (...args: unknown[]): Sequence => {
            const name = typeof args[0] === 'string' ? args[0] : null;
            const state: SequenceRuntime = { disabled: false };
            if (name !== null) sequences.set(name, state);
            const last = args.length - 1;
            const callback = args[last];
            if (typeof callback === 'function') {
              args[last] = guarded(
                name ?? 'a sequence',
                state,
                callback as (...event: unknown[]) => void,
              );
            }
            return (target[property] as (...rest: unknown[]) => Sequence)(
              ...args,
            );
          };
        }
        if (property === 'every' || property === 'at') {
          return (
            first: unknown,
            callback: unknown,
            ...rest: unknown[]
          ): unknown =>
            (target[property] as (...all: unknown[]) => unknown)(
              first,
              typeof callback === 'function'
                ? guarded(
                    `transport.${property}`,
                    { disabled: false },
                    callback as (event: unknown) => void,
                  )
                : callback,
              ...rest,
            );
        }
        const value: unknown = Reflect.get(target, property, target);
        return typeof value === 'function'
          ? (value as (...args: unknown[]) => unknown).bind(target)
          : value;
      },
      set: (target, property, value) =>
        Reflect.set(target, property, value, target),
    });

    function scoped(selector?: string): unknown {
      return selector === undefined ? api() : api(selector);
    }
    return Object.assign(scoped, {
      scope: api.scope,
      bus: (name: string) => api.bus(name),
      transport,
    }) as unknown as ScopeApi;
  }

  #display(event: SequenceEvent): void {
    const name = event.sequence.name;
    // (steps already on their way to the screen when Stop was pressed are not shown)
    if (name === null || this.engine.transport.state !== 'started') return;
    for (const runtime of this.#scopes.values()) {
      if (runtime.scope.transport.get(name) === event.sequence) {
        runtime.playheads.set(name, event.index);
        this.#host.playheadMoved();
        return;
      }
    }
  }

  #clearPlayheads(): void {
    for (const runtime of this.#scopes.values()) runtime.playheads.clear();
    this.#host.playheadMoved();
  }

  // --- Looking things up -----------------------------------------------------------------------------

  #runtime(scopeId: string): ScopeRuntime {
    let runtime = this.#scopes.get(scopeId);
    if (runtime) return runtime;
    const scope =
      scopeId === PROJECT_SCOPE ? this.engine.root : this.engine.scope(scopeId);
    runtime = {
      id: scopeId,
      scope,
      lastTried: null,
      built: false,
      error: null,
      sequences: new Map(),
      codeSteps: new Map(),
      stepMemory: new Map(),
      playheads: new Map(),
      off: [],
    };
    this.#scopes.set(scopeId, runtime);
    const track = this.#host
      .getDoc()
      .tracks.find((candidate) => candidate.id === scopeId);
    if (track) {
      // The track's way out. Made by the host, not by the script, so it is there (and silent) even
      // when the script has never built, and no rebuild removes it.
      scope.bus(OUT_BUS).to('main').gain.set(track.level);
    }
    return runtime;
  }

  #remove(scopeId: string): void {
    const runtime = this.#scopes.get(scopeId);
    if (!runtime || scopeId === PROJECT_SCOPE) return;
    for (const off of runtime.off) off();
    runtime.scope.dispose();
    this.#scopes.delete(scopeId);
  }

  /** The scope's own nodes (not its child scopes', not the insides of macros, not the host's). */
  #ownNodes(runtime: ScopeRuntime): Node[] {
    return [...runtime.scope.select('*')].filter(
      (node) =>
        node.scope === runtime.scope &&
        node.parent === null &&
        node.id !== HOST_PAN_ID,
    );
  }

  #sequence(scopeId: string, name: string): Sequence | null {
    const runtime = this.#scopes.get(scopeId);
    if (!runtime?.sequences.has(name)) return null;
    return runtime.scope.transport.get(name) ?? null;
  }

  #loadSamples(doc: ProjectDocument): void {
    for (const [name, source] of Object.entries(doc.samples)) {
      if (this.#loadedSamples.get(name) === source.url) continue;
      this.#loadedSamples.set(name, source.url);
      // not awaited: a sampler without its sound yet is silent, and plays once it arrives
      this.engine.buffers.load(source.url, { key: name });
    }
  }

  /** Resolves when every sound of the pool has loaded (or failed). For tests and offline rendering. */
  async samplesReady(): Promise<void> {
    await Promise.allSettled(
      Object.keys(this.#host.getDoc().samples).map(
        (name) => this.engine.buffers.get(name)?.ready ?? Promise.resolve(),
      ),
    );
  }
}
