/**
 * Runs a project on a cracked-up engine and keeps the two in step.
 *
 *   project script  -> the engine's root scope
 *   each track      -> a child scope named by the track's id, with a host-made `out` bus (the channel
 *                      strip: level and pan) routed to `main`
 *
 * A script is run with `scope.build`, so re-running changed code only applies the difference, and code
 * that fails leaves the previous version playing. While it runs, the script's control declarations
 * (`slider`, `knob`, `toggle`, `select`, `controls`, `sequencer`: see controls/script-api.ts) tell the
 * runner what they declare and apply the values the project holds for them. The runner is the host side
 * of that: it keeps the declarations, turns them into what the UI draws, and applies a control the user
 * moves to the engine.
 *
 * This is a plain class with no Ember in it: the audio service owns one for the live engine, and tests
 * make their own on an OfflineAudioContext.
 */
import type {
  Engine,
  GraphError,
  Node,
  Param,
  ParamChange,
  Scope,
  ScopeApi,
  SequenceEvent,
} from 'cracked-up';
import {
  compile,
  currentScriptLine,
  type Program,
} from 'client-v2/audio/compile';
import type {
  ControlOptions,
  Declaration,
  DeclarationWarning,
} from 'client-v2/controls/declarations';
import {
  availableModes,
  defaultMode,
  isModeName,
  type ModeName,
} from 'client-v2/controls/modes';
import {
  createControlApi,
  fitSteps,
  type ControlHost,
} from 'client-v2/controls/script-api';
import { sameValue, type Operation } from 'client-v2/project/operations';
import {
  PROJECT_SCOPE,
  sequencerKey,
  type ProjectDocument,
  type ScopeValues,
  type StoredValue,
  type TrackDocument,
} from 'client-v2/project/schema';

/** The pan insert Euclip puts on every track's `out` bus. */
export const HOST_PAN_ID = 'euclip-pan';
/** The bus Euclip makes in every track's scope: the track's way out, through its channel strip. */
export const OUT_BUS = 'out';
/** The group a control with no node is listed under. */
export const OWN_GROUP = 'own';

export interface ScriptError {
  /** `SyntaxError: ...`, as the demo words it */
  message: string;
  /** when the error came from a sequence's callback: which one. That sequence is muted. */
  sequence?: string;
  /** the thrown value, for the editor to place on a line when it can */
  cause: unknown;
}

/** What a control's value can be, from the parameter's metadata or the declaration's options. */
export type ControlMeta =
  | {
      kind: 'number';
      min: number;
      max: number;
      unit: string;
      curve?: string;
      step?: number;
      values?: number[];
    }
  | { kind: 'boolean' }
  | { kind: 'choice'; choices: readonly (string | number)[] };

/** A declared control bound to a parameter, or with a value of its own, as the UI draws it. */
export interface ControlView {
  key: string;
  /** which widget draws it: a key of the widget registry */
  kind: string;
  label: string;
  /** declared by `controls('#node')`: listed under "more" */
  implicit: boolean;
  line?: number;
  /** what it is listed under: the node its selector finds, or OWN_GROUP */
  group: { id: string; label: string; type: string; byPosition: boolean };
  meta: ControlMeta;
  /** where the control is: the value the project holds, else what the script itself gives */
  value: number | boolean | string;
  /** where the parameter is, when code has moved it away from the control's value; else null */
  effective: number | boolean | string | null;
  /** the project holds a value for it (so Reset has something to forget) */
  stored: boolean;
  /** number controls: the slider mode in use, and the ones on offer */
  mode: ModeName;
  modes: ModeName[];
}

/** A declared sequencer: the grid of a named sequence. */
export interface SequencerView {
  key: string;
  /** the sequence's name in the script */
  name: string;
  label: string;
  /** the live pattern */
  steps: number[];
  /** the project holds a pattern for it */
  stored: boolean;
  /** the step last heard, or null when stopped */
  playhead: number | null;
  /** its callback threw and it is muted until the script runs again */
  disabled: boolean;
  /** how its steps are drawn. Only 'toggles' exists so far. */
  view: string;
  line?: number;
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
  /** Applies an operation that came from a script (`control.set(…)`): stored, but not a step to undo. */
  dispatch(op: Operation): void;
  /** Something the UI shows has changed: controls, values, errors. */
  changed(): void;
  /** A playhead moved. Separate, because it happens on every step. */
  playheadMoved(): void;
}

interface ScopeRuntime {
  id: string;
  scope: Scope;
  /** the text most recently attempted, so a run with nothing new does nothing */
  lastTried: string | null;
  /** whether any version is running */
  built: boolean;
  error: ScriptError | null;
  /** what the running version declares, in the order it declared it */
  declarations: Declaration[];
  warnings: DeclarationWarning[];
  /** what the script itself gives each parameter that has a control with nothing stored */
  defaults: Map<string, StoredValue>;
  /** where each controlled parameter is, as far as has been heard: `nodeId/param` to value */
  heard: Map<string, StoredValue>;
  /** sequences muted because their callback threw */
  errored: Set<string>;
  /** what a step held before it was switched off, so switching it on again brings that back */
  stepMemory: Map<string, number[]>;
  playheads: Map<string, number>;
  off: (() => void)[];
}

function describeError(error: unknown, sequence?: string | null): ScriptError {
  // a failed build (or a callback's error) wraps what the code threw; the original says more
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

function valuesOf(doc: ProjectDocument, scopeId: string): ScopeValues | null {
  if (scopeId === PROJECT_SCOPE) return doc.values;
  return doc.tracks.find((track) => track.id === scopeId)?.values ?? null;
}

function scriptOf(doc: ProjectDocument, scopeId: string): string | null {
  if (scopeId === PROJECT_SCOPE) return doc.script;
  return doc.tracks.find((track) => track.id === scopeId)?.script ?? null;
}

const heardKey = (node: Node, param: string): string => `${node.id}/${param}`;

export class ProjectRunner {
  readonly engine: Engine;
  readonly #host: RunnerHost;
  readonly #scopes = new Map<string, ScopeRuntime>();
  readonly #off: (() => void)[] = [];
  readonly #timers = new Set<ReturnType<typeof setTimeout>>();
  #loadedSamples = new Map<string, string>();
  /** the audio time of the parameter change most recently made, for `control.set()` in a callback */
  #lastChangeAt: number | null = null;

  constructor(engine: Engine, host: RunnerHost) {
    this.engine = engine;
    this.#host = host;
    // Playheads move when a step is heard, not when its callback runs (which is ahead of the sound).
    this.#off.push(
      engine.transport.onDisplay((event) => this.#display(event)),
      engine.transport.on('stop', () => this.#clearPlayheads()),
      engine.on('error', (error) => {
        // A callback that throws is dealt with per scope (see #onScopeError). What is left is trouble
        // outside any script's run, such as a sound that would not load.
        if (error.code !== 'callback') {
          console.warn('Euclip: the audio engine reported an error.', error);
        }
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
    for (const timer of this.#timers) clearTimeout(timer);
    this.#timers.clear();
    for (const runtime of this.#scopes.values()) {
      for (const off of runtime.off) off();
    }
    this.#scopes.clear();
  }

  // --- Running scripts ---------------------------------------------------------------------------

  /**
   * Runs a scope's script as it is in the document now. A syntax error, or a throw while building,
   * leaves the version that was running untouched and records the error.
   * @param force run even though this text was the last one tried (a control was reset, or the
   *   document was replaced: the stored values the declarations read have changed)
   */
  async run(scopeId: string, force = false): Promise<void> {
    const doc = this.#host.getDoc();
    const code = scriptOf(doc, scopeId);
    if (code === null) return;
    const runtime = this.#runtime(scopeId);
    if (code === runtime.lastTried && !force) return;
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

    // What this run declares. It replaces the last run's only if the run succeeds.
    const declared = new Map<string, Declaration>();
    const warnings: DeclarationWarning[] = [];
    const host: ControlHost = {
      stored: (key) =>
        valuesOf(this.#host.getDoc(), scopeId)?.controls[key]?.value,
      declare: (declaration) => {
        const earlier = declared.get(declaration.key);
        // an explicit slider('#x', 'p') wins over the same parameter from controls('#x')
        if (earlier && !earlier.implicit && declaration.implicit) return;
        declared.set(declaration.key, declaration);
      },
      warn: (warning) => warnings.push(warning),
      moved: (key, value) => this.#movedByScript(runtime, key, value),
    };
    const track = doc.tracks.find((candidate) => candidate.id === scopeId);
    try {
      const result = await runtime.scope.build((api) => {
        if (track) this.#channelStrip(api, track);
        program(api, createControlApi(api, host, currentScriptLine));
      });
      runtime.built = true;
      runtime.declarations = [...declared.values()];
      runtime.warnings = this.#explain(runtime, warnings);
      // One bad node does not stop the rest of a build applying: what could be built is now running.
      runtime.error = result.errors[0] ? describeError(result.errors[0]) : null;
      // A rebuild keeps a sequence's mute: the new version gets a fresh start.
      for (const sequence of runtime.scope.transport.sequences) {
        if (sequence.name !== null && runtime.errored.has(sequence.name)) {
          sequence.muted = false;
        }
      }
      runtime.errored.clear();
      this.#afterBuild(runtime);
    } catch (error) {
      // The version that was running is untouched, and so is what it declared.
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
    // Every script runs again: its declarations apply whatever the document now holds for them, and a
    // control with nothing stored goes back to what the script says. Unchanged nodes are not disturbed.
    for (const id of [PROJECT_SCOPE, ...doc.tracks.map((track) => track.id)]) {
      await this.run(id, true);
    }
    for (const track of doc.tracks) this.#applyStrip(track);
    this.#host.changed();
  }

  /**
   * Applies one operation to the engine. The document has already changed.
   * @param fromScript the operation records something a script did (`control.set`): the engine is
   *   already there.
   */
  handle(op: Operation, fromScript = false): void {
    const doc = this.#host.getDoc();
    switch (op.type) {
      case 'setBpm':
        this.engine.transport.bpm = doc.bpm;
        break;
      case 'setControlValue':
        if (!fromScript) this.#applyControl(op.scope, op.key, op.value);
        break;
      case 'resetControl':
        // With nothing stored, the declaration sets nothing and the rebuild ends on the script's own
        // value: running the script again is the reset.
        void this.run(op.scope, true);
        break;
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
      case 'setControlOptions':
      case 'renameTrack':
      case 'setProjectName':
        // (a script is run by whoever owns the pause after typing: see services/audio.ts)
        break;
    }
    this.#host.changed();
  }

  // --- What the UI shows --------------------------------------------------------------------------

  error(scopeId: string): ScriptError | null {
    return this.#scopes.get(scopeId)?.error ?? null;
  }

  /** What is wrong with individual declarations of the running version. The rest of the script runs. */
  warnings(scopeId: string): DeclarationWarning[] {
    return this.#scopes.get(scopeId)?.warnings ?? [];
  }

  /** Whether the scope has a version running. False for a script that has never built. */
  isBuilt(scopeId: string): boolean {
    return this.#scopes.get(scopeId)?.built ?? false;
  }

  /** What the running version declares, as plain data, in the order it declared it. */
  declarations(scopeId: string): readonly Declaration[] {
    return this.#scopes.get(scopeId)?.declarations ?? [];
  }

  /** The declared controls bound to a parameter or with a value of their own, in declaration order. */
  controls(scopeId: string): ControlView[] {
    const runtime = this.#scopes.get(scopeId);
    if (!runtime) return [];
    const values = valuesOf(this.#host.getDoc(), scopeId);
    const views: ControlView[] = [];
    for (const declaration of runtime.declarations) {
      const binding = declaration.bindings[0];
      if (!binding || binding.type === 'sequence') continue;
      const state = values?.controls[declaration.key];
      const stored = state?.value;
      const options = declaration.options;

      let meta: ControlMeta;
      let group: ControlView['group'];
      let live: StoredValue | undefined;
      let fallback: StoredValue | undefined;
      let name: string;
      if (binding.type === 'param') {
        const nodes = this.#select(runtime, binding.selector);
        const node = nodes[0];
        if (!node || !(binding.param in node.params)) continue;
        const param = node.param(binding.param);
        meta = this.#metaOf(param, options);
        live = runtime.heard.get(heardKey(node, binding.param)) ?? param.value;
        fallback = runtime.defaults.get(declaration.key) ?? live;
        name = binding.param;
        group = {
          id: node.id,
          label:
            nodes.length > 1
              ? `${binding.selector} (${nodes.length} nodes)`
              : node.id,
          type: node.type,
          byPosition: node.autoId,
        };
      } else {
        meta =
          declaration.kind === 'toggle'
            ? { kind: 'boolean' }
            : {
                kind: 'number',
                min: options.min ?? 0,
                max: options.max ?? 1,
                unit: options.unit ?? 'none',
                ...(options.step === undefined ? {} : { step: options.step }),
                ...(options.values === undefined
                  ? {}
                  : { values: options.values }),
              };
        fallback =
          options.default ?? (meta.kind === 'boolean' ? false : meta.min);
        name = binding.name;
        group = {
          id: OWN_GROUP,
          label: scopeId === PROJECT_SCOPE ? 'Project' : 'Track',
          type: '',
          byPosition: false,
        };
      }

      const value = stored ?? fallback;
      if (value === undefined || Array.isArray(value)) continue;
      const moved =
        live !== undefined && !Array.isArray(live) && !sameNumber(live, value);
      const modes = meta.kind === 'number' ? availableModes(meta) : [];
      const wanted = state?.options?.mode ?? options.mode;
      views.push({
        key: declaration.key,
        kind: declaration.kind,
        label: options.label ?? name,
        implicit: declaration.implicit,
        ...(declaration.line === undefined ? {} : { line: declaration.line }),
        group,
        meta,
        value,
        effective: moved ? (live as number | boolean | string) : null,
        stored: stored !== undefined,
        mode:
          isModeName(wanted) && modes.includes(wanted)
            ? wanted
            : meta.kind === 'number'
              ? defaultMode(meta)
              : 'linear',
        modes,
      });
    }
    return views;
  }

  /** The declared sequencers, in the order the script declared them. */
  sequencers(scopeId: string): SequencerView[] {
    const runtime = this.#scopes.get(scopeId);
    if (!runtime) return [];
    const values = valuesOf(this.#host.getDoc(), scopeId);
    const views: SequencerView[] = [];
    for (const declaration of runtime.declarations) {
      const binding = declaration.bindings[0];
      if (binding?.type !== 'sequence') continue;
      const sequence = runtime.scope.transport.get(binding.name);
      if (!sequence) continue;
      views.push({
        key: declaration.key,
        name: binding.name,
        label: declaration.options.label ?? binding.name,
        steps: [...sequence.steps],
        stored: Array.isArray(values?.controls[declaration.key]?.value),
        playhead: runtime.playheads.get(binding.name) ?? null,
        disabled: runtime.errored.has(binding.name),
        view: declaration.options.view ?? 'toggles',
        ...(declaration.line === undefined ? {} : { line: declaration.line }),
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
      for (const sequence of runtime.scope.transport.sequences) {
        if (sequence.name !== null) sequences.add(sequence.name);
      }
    }
    return {
      buffers: Object.keys(this.#host.getDoc().samples),
      ids: [...ids],
      buses: [...buses],
      sequences: [...sequences],
    };
  }

  // --- Operations the UI asks for --------------------------------------------------------------------

  /**
   * The operation for pressing a step of a declared sequencer. An on step goes off; an off step comes
   * back to what it held before (so a step holding 3 is not flattened to 1), or to 1.
   */
  toggleStepOperation(
    scopeId: string,
    name: string,
    index: number,
  ): Operation | null {
    const runtime = this.#scopes.get(scopeId);
    const key = sequencerKey(name);
    const sequence = runtime?.scope.transport.get(name);
    if (
      !runtime ||
      !sequence ||
      !runtime.declarations.some((declaration) => declaration.key === key) ||
      index < 0 ||
      index >= sequence.steps.length
    ) {
      return null;
    }
    const steps = [...sequence.steps];
    const memory = runtime.stepMemory.get(name) ?? [];
    const current = steps[index] ?? 0;
    if (current !== 0) {
      memory[index] = current;
      steps[index] = 0;
    } else {
      steps[index] = memory[index] || 1;
    }
    runtime.stepMemory.set(name, memory);
    return { type: 'setControlValue', scope: scopeId, key, value: steps };
  }

  // --- Controls: the host side ---------------------------------------------------------------------

  /** The user moved a control: the same `set` (or `update`) its declaration does with a stored value. */
  #applyControl(scopeId: string, key: string, value: StoredValue): void {
    const runtime = this.#scopes.get(scopeId);
    const binding = runtime?.declarations.find(
      (declaration) => declaration.key === key,
    )?.bindings[0];
    if (!runtime || !binding) return; // a value for a control that is not declared now: dormant
    if (binding.type === 'param' && !Array.isArray(value)) {
      runtime.scope.$(binding.selector).set({ [binding.param]: value });
    } else if (binding.type === 'sequence' && Array.isArray(value)) {
      const sequence = runtime.scope.transport.get(binding.name);
      sequence?.update({ steps: fitSteps(value, sequence.steps) });
    }
  }

  /**
   * A script moved a control with `.set()`. The parameter is already set; what is left is the control
   * on screen and the document, which follow when the change is heard: inside a sequence callback that
   * is the step's time, not now (callbacks run ahead of the sound).
   */
  #movedByScript(runtime: ScopeRuntime, key: string, value: StoredValue): void {
    const at = this.#lastChangeAt;
    this.#lastChangeAt = null;
    this.#whenHeard(at, () =>
      this.#host.dispatch({
        type: 'setControlValue',
        scope: runtime.id,
        key,
        value,
      }),
    );
  }

  /** A parameter changed, by anyone. Where it is now is shown from the moment the change is heard. */
  #onParamChange(runtime: ScopeRuntime, change: ParamChange): void {
    if (change.param.node.scope !== runtime.scope) return;
    this.#lastChangeAt = change.at;
    this.#whenHeard(change.at, () => {
      runtime.heard.set(
        heardKey(change.param.node, change.param.name),
        change.value,
      );
      this.#host.changed();
    });
  }

  /** Calls back when a given audio time is heard: at once if that is now, or offline. */
  #whenHeard(at: number | null, callback: () => void): void {
    const context = this.engine.context;
    if (at === null || this.engine.offline) return callback();
    const latency = (context as AudioContext).outputLatency || 0;
    const wait = (at + latency - context.currentTime) * 1000;
    if (wait < 8) return callback();
    const timer = setTimeout(() => {
      this.#timers.delete(timer);
      callback();
    }, wait);
    this.#timers.add(timer);
  }

  /** Straight after a successful build: where the controlled parameters are, and their defaults. */
  #afterBuild(runtime: ScopeRuntime): void {
    const values = valuesOf(this.#host.getDoc(), runtime.id);
    runtime.heard = new Map();
    runtime.defaults = new Map();
    for (const declaration of runtime.declarations) {
      const binding = declaration.bindings[0];
      if (binding?.type !== 'param') continue;
      const node = this.#select(runtime, binding.selector)[0];
      if (!node) continue;
      // With nothing stored the declaration set nothing, so the parameter is where the script put it:
      // that is the control's default. (With a value stored, the script's own number is not readable.)
      if (values?.controls[declaration.key]?.value === undefined) {
        runtime.defaults.set(declaration.key, node.param(binding.param).value);
      }
    }
  }

  /** Words a warning for where things stand now that the whole script has run. */
  #explain(
    runtime: ScopeRuntime,
    warnings: DeclarationWarning[],
  ): DeclarationWarning[] {
    return warnings.map((warning) => {
      const name = warning.missingSequence;
      if (name === undefined || !runtime.scope.transport.get(name))
        return warning;
      return {
        ...warning,
        message: `sequencer('${name}') is declared before the sequence is made. Move it below the __.transport.sequence('${name}', …) call.`,
      };
    });
  }

  #metaOf(param: Param, options: ControlOptions): ControlMeta {
    const meta = param.meta;
    if (meta.kind === 'boolean') return { kind: 'boolean' };
    if (meta.kind === 'choice')
      return { kind: 'choice', choices: meta.choices };
    const step = options.step ?? meta.step;
    return {
      kind: 'number',
      min: Math.max(meta.min, options.min ?? meta.min),
      max: Math.min(meta.max, options.max ?? meta.max),
      unit: meta.unit,
      curve: meta.curve,
      ...(step === undefined ? {} : { step }),
      ...(options.values === undefined ? {} : { values: options.values }),
    };
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

  // --- Errors and playheads -------------------------------------------------------------------------

  /**
   * A callback of this scope threw. The library keeps calling it, so the runner quietens it: a
   * sequence is muted (and un-muted when the script next runs successfully), anything else is removed.
   * The rest of the track, and every other track, carries on.
   */
  #onScopeError(runtime: ScopeRuntime, error: GraphError): void {
    const origin = error.origin;
    if (!origin || origin.scope !== runtime.scope) return;
    if (origin.sequence) {
      origin.sequence.muted = true;
      if (origin.name !== null) runtime.errored.add(origin.name);
    } else {
      origin.cancel();
    }
    runtime.error = describeError(
      error.cause ?? error,
      origin.name ?? `transport.${origin.kind}`,
    );
    this.#host.changed();
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
    const created: ScopeRuntime = {
      id: scopeId,
      scope,
      lastTried: null,
      built: false,
      error: null,
      declarations: [],
      warnings: [],
      defaults: new Map(),
      heard: new Map(),
      errored: new Set(),
      stepMemory: new Map(),
      playheads: new Map(),
      off: [],
    };
    runtime = created;
    this.#scopes.set(scopeId, created);
    const track = this.#host
      .getDoc()
      .tracks.find((candidate) => candidate.id === scopeId);
    if (track) {
      // The track's way out. Made by the host, not by the script, so it is there (and silent) even
      // when the script has never built, and no rebuild removes it.
      scope.bus(OUT_BUS).to('main').gain.set(track.level);
    }
    created.off.push(
      scope.on('param:changed', (change) =>
        this.#onParamChange(created, change),
      ),
      scope.on('error', (error) => this.#onScopeError(created, error)),
    );
    return created;
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

  /** The nodes a selector finds, exactly as the script's own `__(selector)` would. */
  #select(runtime: ScopeRuntime, selector: string): Node[] {
    try {
      return [...runtime.scope.$(selector)];
    } catch {
      return [];
    }
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

/** Whether a parameter is where a control is, allowing for what a 32-bit audio parameter can hold. */
function sameNumber(a: StoredValue, b: StoredValue): boolean {
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a), Math.abs(b));
  }
  return sameValue(a, b);
}
