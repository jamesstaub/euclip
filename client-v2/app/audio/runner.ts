/**
 * Runs a project on a cracked-up engine and keeps the two in step.
 *
 *   project script  -> the engine's root scope
 *   each track      -> a scope named by the track's id that holds Euclip's own parts (the `out` bus
 *                      and its pan: the channel strip), and inside it a child scope, `script`, that
 *                      the track's script builds in
 *
 * A script is run with `scope.build`, so re-running changed code only applies the difference, and code
 * that fails leaves the previous version playing. While it runs, the script's control declarations
 * (`slider`, `knob`, `toggle`, `select`, `controls`, `step grid`: see controls/script-api.ts) tell the
 * runner what they declare and apply the values the project holds for them. The runner is the host side
 * of that: it keeps the declarations, turns them into what the UI draws, and applies a control the user
 * moves to the engine.
 *
 * This is a plain class with no Ember in it: the audio service owns one for the live engine, and tests
 * make their own on an OfflineAudioContext.
 */
import type {
  BufferRef,
  Bus,
  Engine,
  GraphError,
  Node,
  Param,
  ParamChange,
  Scope,
  SequenceEvent,
} from 'cracked-up';
import {
  compile,
  currentScriptLine,
  type Program,
} from 'client-v2/audio/compile';
import { normalizeSlices } from 'cracked-up/util';
import { STORED_BUFFER_CHOICE } from 'client-v2/controls/features';
import {
  BUFFER_OPTION,
  CHANNEL_BUS,
  HOST_TAG,
  type ControlOptions,
  type Declaration,
  type DeclarationWarning,
} from 'client-v2/controls/declarations';
import { liveRange } from 'client-v2/controls/live-range';
import {
  availableModes,
  defaultMode,
  isModeName,
  mapping,
  type ModeName,
  type NumberMeta,
} from 'client-v2/controls/modes';
import {
  createControlApi,
  fitSteps,
  type ControlHost,
} from 'client-v2/controls/script-api';
import { sameValue, type Operation } from 'client-v2/project/operations';
import {
  PROJECT_SCOPE,
  controlKey,
  stepGridKey,
  type ProjectDocument,
  type ScopeValues,
  type StoredValue,
  type TrackDocument,
} from 'client-v2/project/schema';

/** The pan insert Euclip puts on every track's `out` bus. */
export const HOST_PAN_ID = 'euclip-pan';
/** The bus Euclip makes in every track's scope: the track's way out, through its channel strip. */
export const OUT_BUS = CHANNEL_BUS;
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

/**
 * What a control's value can be: the parameter's metadata, narrowed by the declaration's options and by
 * what is live around it (the length of the sample a sampler plays, the length of a step at this tempo).
 */
export type ControlMeta =
  | ({ kind: 'number'; unit: string } & NumberMeta)
  | { kind: 'boolean' }
  | { kind: 'choice'; choices: readonly (string | number)[] };

/** The section of the controls pane a control is listed in: one per node. */
export interface ControlGroup {
  /** the node's id; OWN_GROUP for controls with no node; `several:<key>` for one control over several */
  id: string;
  /** the whole heading as plain words, for assistive tech: `lowpass filter`, `lowpass 2`, `Track` */
  label: string;
  /** the node's type: what the heading leads with. Empty for OWN_GROUP. */
  type: string;
  /** the id the script gave the node; null for a node with an automatic id (never shown) */
  name: string | null;
  /** which of the script's nodes of this type it is, counted from 1, when there are several and it has no id */
  ordinal: number | null;
  /** how many nodes the control moves together (1 for a node's own section) */
  count: number;
  /** the node has no id of its own: stored values follow its position in the script */
  byPosition: boolean;
  /** which of the script's chains the node is in, counted from 0 in the order written; -1 for OWN_GROUP */
  chain: number;
  /** the bus this section belongs to: the bus's own level, or one of its inserts. Null for the rest. */
  bus: string | null;
}

/** A declared control bound to a parameter, or with a value of its own, as the UI draws it. */
export interface ControlView {
  key: string;
  /** which widget draws it: a key of the widget registry */
  kind: string;
  label: string;
  /** made by `controls()` rather than a `slider`, `knob`, `toggle` or `select` of its own */
  implicit: boolean;
  line?: number;
  group: ControlGroup;
  meta: ControlMeta;
  /** where the control is: the value the project holds, else what the script itself gives */
  value: number | boolean | string;
  /**
   * Where the parameter is, when something other than the control has put it somewhere else (a
   * callback, a `set` in the script) and it has stayed there a moment; else null. Moving the control
   * moves the parameter, so a person's own drag never shows here.
   */
  effective: number | boolean | string | null;
  /** the project holds a value for it (so Reset has something to forget) */
  stored: boolean;
  /** number controls: the unit in use, and the ones on offer */
  mode: ModeName;
  modes: ModeName[];
  /** its range depends on something not there yet (a sample still loading): what, in words */
  waiting?: string;
}

/** A declared step grid: the grid of a named sequence. */
export interface StepGridView {
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
  buffers: { key: string; duration?: number | null; slices?: number }[];
  /** node ids, with the node's type so the editor knows its parameters where the id is named */
  ids: { name: string; type?: string; description?: string }[];
  buses: { name: string; description?: string }[];
  sequences: { name: string; description?: string }[];
}

/** One of a sampler's sounding voices is drawn from this: see ProjectRunner#sampler. */
export interface WaveformView {
  /** the declaration's key: the sampler's id and `waveform` */
  key: string;
  /** the sampler's id in its scope */
  nodeId: string;
  label: string;
  line?: number;
  /** the node has no id of its own: stored values follow its position in the script */
  byPosition: boolean;
  /** the sound the sampler plays now: its name in the pool, its length and slices. Null: none. */
  sound: {
    key: string;
    state: 'loading' | 'ready' | 'error';
    duration: number | null;
    slices: readonly number[];
  } | null;
  /** whether the sound can be chosen here and kept in the project (controls/features.ts) */
  choosable: boolean;
  /** the project holds a choice of sound for it (so Reset has something to forget) */
  soundStored: boolean;
  /** the key the choice of sound is stored under */
  soundKey: string;
  /** the controls it is a view over, by parameter name: the same ones a slider for each would be */
  params: Partial<Record<string, ControlView>>;
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
  /** The bytes of a sound the person added (project/storage.ts), or null if they are gone. */
  readFile?(id: string): Promise<ArrayBuffer | null>;
}

interface ScopeRuntime {
  id: string;
  /** the scope the script builds in */
  scope: Scope;
  /** the scope Euclip's own parts of the track are in: `scope`'s parent (for the project, `scope` itself) */
  host: Scope;
  /** the text most recently attempted, so a run with nothing new does nothing */
  lastTried: string | null;
  /** whether any version is running */
  built: boolean;
  /** whether the running version sends anything to the track's channel bus */
  sendsToChannel: boolean;
  error: ScriptError | null;
  /** what the running version declares, in the order it declared it */
  declarations: Declaration[];
  warnings: DeclarationWarning[];
  /** what the script itself gives each parameter that has a control with nothing stored */
  defaults: Map<string, StoredValue>;
  /** where each controlled parameter is, as far as has been heard: `nodeId/param` to value */
  heard: Map<string, StoredValue>;
  /** which declaration controls each parameter of each node (`nodeId/param` to its key), as of the last build */
  claims: Map<string, string>;
  /** controls whose parameter is away from them, and since when (ms): the marker waits a moment */
  differing: Map<string, number>;
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
/** (a bus's level is the gain of a node the library keeps for it, called `bus:<name>`) */
const busHeardKey = (bus: string): string => `bus:${bus}/gain`;

/** Where the script's nodes and buses are in the order of things: see ProjectRunner#layout. */
interface Layout {
  nodes: Map<
    string,
    { index: number; chain: number; ordinal: number | null; bus: string | null }
  >;
  busChain(bus: string): number;
  busOrder(bus: string): number;
}

/** How long a parameter must be away from its control before the control says so. */
export const EFFECTIVE_DELAY_MS = 150;
/** How far apart, as a share of the control's travel, still counts as the same place. */
const SAME_PLACE = 0.002;

export interface RunnerOptions {
  /**
   * The engine plays in real time: a change is shown when it is heard, and the "now at" marker waits
   * EFFECTIVE_DELAY_MS before it shows. Default: whether the engine's context is a live one. Offline
   * (tests, rendering) everything is immediate.
   */
  realtime?: boolean;
}

export class ProjectRunner {
  readonly engine: Engine;
  readonly #host: RunnerHost;
  readonly #scopes = new Map<string, ScopeRuntime>();
  readonly #off: (() => void)[] = [];
  readonly #timers = new Set<ReturnType<typeof setTimeout>>();
  #loadedSamples = new Map<string, string>();
  /** the audio time of the parameter change most recently made, for `control.set()` in a callback */
  #lastChangeAt: number | null = null;
  /** the document's slices are being given to a sound: not a change to send back to the document */
  #settingSlices = false;
  readonly #missing = new Set<string>();
  readonly #reading = new Set<Promise<void>>();
  /** a control is being applied: the parameter changes that follow are the user's own move */
  #applying = false;
  readonly #realtime: boolean;

  constructor(engine: Engine, host: RunnerHost, options: RunnerOptions = {}) {
    this.engine = engine;
    this.#host = host;
    this.#realtime = options.realtime ?? !engine.offline;
    // Playheads move when a step is heard, not when its callback runs (which is ahead of the sound).
    this.#off.push(
      engine.transport.onDisplay((event) => this.#display(event)),
      engine.transport.on('stop', () => this.#clearPlayheads()),
      // a control's range can depend on a sample (a sampler's start and end): say when one arrives
      engine.buffers.on('ready', (ref) => {
        this.#missing.delete(ref.key);
        this.#applySlices(ref.key);
        this.#host.changed();
      }),
      engine.buffers.on('slices', (ref) => this.#onSlices(ref)),
      engine.buffers.on('error', () => this.#host.changed()),
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
    await this.#filesRead();
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
    // which declaration controls each parameter of each node, however the declaration was written
    const claims = new Map<string, string>();
    const claimsOf = (declaration: Declaration): string[] =>
      // (a compound widget lists what it is a view over; the parts are declared, and claimed, themselves)
      (declaration.kind === 'waveform' ? [] : declaration.bindings).flatMap(
        (binding) =>
          binding.type === 'param'
            ? declaration.nodes.map((node) => `${node}/${binding.param}`)
            : binding.type === 'bus'
              ? [`bus:${binding.name}/gain`]
              : [],
      );
    const host: ControlHost = {
      stored: (key) =>
        valuesOf(this.#host.getDoc(), scopeId)?.controls[key]?.value,
      declare: (declaration) => {
        // A sampler has one waveform editor and a sequence one grid. One the script wrote
        // (waveform('#kick'), stepGrid('steps')) is used instead of the one controls() would give,
        // whichever comes first; of two it wrote, the first waveform line stands (a later
        // waveform('sampler') that also finds the sampler adds nothing, and does not undo its label).
        const same = declared.get(declaration.key);
        if (
          same &&
          (declaration.kind === 'waveform' || declaration.kind === 'stepGrid')
        ) {
          if (declaration.implicit) return false;
          if (declaration.kind === 'waveform' && !same.implicit) return false;
        }
        const wanted = [...new Set(claimsOf(declaration))];
        // Who has the better claim to a parameter, wherever each is in the script: an explicit
        // slider('#x', 'p'), then controls(), then a compound widget's own part (a waveform's start).
        const rank = rankOf(declaration);
        const holders = wanted
          .map((claim) => declared.get(claims.get(claim) ?? ''))
          .filter((holder): holder is Declaration => holder !== undefined);
        if (rank < 2 && holders.some((holder) => rankOf(holder) >= rank)) {
          return false;
        }
        for (const holder of holders) {
          if (rankOf(holder) < rank) declared.delete(holder.key);
        }
        declared.set(declaration.key, declaration);
        for (const claim of wanted) claims.set(claim, declaration.key);
        return true;
      },
      warn: (warning) => warnings.push(warning),
      moved: (key, value) => this.#movedByScript(runtime, key, value),
    };
    try {
      const result = await runtime.scope.build((api) => {
        const controls = createControlApi(api, host, currentScriptLine);
        program(api, controls.functions);
        controls.finish();
      });
      runtime.built = true;
      runtime.declarations = [...declared.values()];
      runtime.claims = claims;
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
    await this.#filesRead();
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
      case 'addSample':
      case 'removeSample':
        this.#loadSamples(doc);
        break;
      case 'setSampleSlices':
        if (!fromScript) this.#applySlices(op.name);
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

  /**
   * Whether the channel strip of a track has anything to act on: the running version of its script
   * sends sound to `channel`. True while no version runs (there is nothing to say about it yet).
   */
  sendsToChannel(scopeId: string): boolean {
    const runtime = this.#scopes.get(scopeId);
    return !runtime?.built || runtime.sendsToChannel;
  }

  /** What the running version declares, as plain data, in the order it declared it. */
  declarations(scopeId: string): readonly Declaration[] {
    return this.#scopes.get(scopeId)?.declarations ?? [];
  }

  /**
   * The declared controls bound to a parameter or with a value of their own. Controls of their own come
   * first; the rest follow the script's nodes in the order it made them, chain by chain, and within a
   * node the order they were declared in.
   */
  controls(scopeId: string): ControlView[] {
    return this.#controlViews(scopeId, false);
  }

  /** Every declared control as the UI draws it; `all` includes the parts of compound widgets. */
  #controlViews(scopeId: string, all: boolean): ControlView[] {
    const runtime = this.#scopes.get(scopeId);
    if (!runtime) return [];
    const values = valuesOf(this.#host.getDoc(), scopeId);
    const layout = this.#layout(runtime);
    const stepSeconds = this.#stepSeconds(runtime);
    const views: { view: ControlView; order: number }[] = [];
    for (const declaration of runtime.declarations) {
      const binding = declaration.bindings[0];
      if (
        !binding ||
        binding.type === 'sequence' ||
        binding.type === 'option' ||
        declaration.kind === 'waveform' ||
        (declaration.hidden && !all)
      ) {
        continue;
      }
      const state = values?.controls[declaration.key];
      const stored = state?.value;
      const options = declaration.options;

      let meta: ControlMeta;
      let group: ControlGroup;
      let live: StoredValue | undefined;
      let fallback: StoredValue | undefined;
      let name: string;
      let order = -1;
      let waiting: string | undefined;
      let shown = (value: StoredValue): StoredValue => value;
      if (binding.type === 'param') {
        const nodes = this.#select(runtime, binding.selector);
        const node = nodes[0];
        if (!node || !(binding.param in node.params)) continue;
        const param = node.param(binding.param);
        const range = liveRange({ engine: this.engine, node }, binding.param);
        meta = this.#metaOf(param, options);
        if (meta.kind === 'number') {
          meta = {
            ...meta,
            name: binding.param,
            ...(stepSeconds === null ? {} : { stepSeconds }),
          };
          if (range) {
            const { waiting: why, min, max, ...rest } = range;
            const show = range.shown?.bind(range);
            delete rest.shown;
            meta = {
              ...meta,
              ...rest,
              min: Math.max(meta.min, min ?? meta.min),
              max: Math.max(
                Math.max(meta.min, min ?? meta.min),
                Math.min(options.max ?? Infinity, max ?? meta.max),
              ),
            };
            waiting = why;
            if (show) {
              shown = (value) =>
                typeof value === 'number' ? show(value) : value;
            }
          }
        }
        live = runtime.heard.get(heardKey(node, binding.param)) ?? param.value;
        fallback = runtime.defaults.get(declaration.key) ?? live;
        name = binding.param;
        const place = layout.nodes.get(node.id);
        const reached = this.#reach(runtime, declaration);
        if (reached.length > 1) {
          // one control over several nodes is not any one node's: it gets a section of its own
          const sameType = reached.every((other) => other.type === node.type);
          const said =
            declaration.bindings.length > 1 ? null : binding.selector;
          group = {
            id: `several:${declaration.key}`,
            label: `${said ?? 'several'} (${reached.length} nodes)`,
            type: sameType ? node.type : 'nodes',
            name: said,
            ordinal: null,
            count: reached.length,
            byPosition: false,
            chain: place?.chain ?? 0,
            bus: place?.bus ?? null,
          };
          order = (place?.index ?? 0) + 0.5;
        } else {
          const ordinal = node.autoId ? (place?.ordinal ?? null) : null;
          group = {
            id: node.id,
            label: node.autoId
              ? `${node.type}${ordinal === null ? '' : ` ${ordinal}`}`
              : `${node.type} ${node.id}`,
            type: node.type,
            name: node.autoId ? null : node.id,
            ordinal,
            count: 1,
            byPosition: node.autoId,
            chain: place?.chain ?? 0,
            bus: place?.bus ?? null,
          };
          order = place?.index ?? 0;
        }
      } else if (binding.type === 'bus') {
        const bus = this.#busOf(runtime, binding.name);
        if (!bus) continue;
        meta = this.#metaOf(bus.gain, options);
        if (meta.kind === 'number') meta = { ...meta, name: 'gain' };
        live = runtime.heard.get(busHeardKey(binding.name)) ?? bus.gain.value;
        fallback = typeof options.default === 'number' ? options.default : 1;
        name = 'level';
        group = {
          id: `bus:${binding.name}`,
          label: `${binding.name} bus level`,
          type: 'level',
          name: null,
          ordinal: null,
          count: 1,
          byPosition: false,
          chain: layout.busChain(binding.name),
          bus: binding.name,
        };
        // before the bus's inserts; a bus with none comes after the script's nodes
        order = layout.busOrder(binding.name);
      } else {
        meta =
          declaration.kind === 'toggle'
            ? { kind: 'boolean' }
            : {
                kind: 'number',
                min: options.min ?? 0,
                max: options.max ?? 1,
                unit: options.unit ?? 'none',
                name: binding.name,
                ...(stepSeconds === null ? {} : { stepSeconds }),
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
          name: null,
          ordinal: null,
          count: 1,
          byPosition: false,
          chain: -1,
          bus: null,
        };
      }

      const raw = stored ?? fallback;
      if (raw === undefined || Array.isArray(raw)) continue;
      const value = shown(raw) as number | boolean | string;
      const modes = meta.kind === 'number' ? availableModes(meta) : [];
      const wanted = state?.options?.mode ?? options.mode;
      const mode =
        isModeName(wanted) && modes.includes(wanted)
          ? wanted
          : meta.kind === 'number'
            ? defaultMode(meta)
            : 'linear';
      const now =
        live === undefined || Array.isArray(live)
          ? undefined
          : (shown(live) as number | boolean | string);
      const away =
        now !== undefined &&
        !(meta.kind === 'number' &&
        typeof now === 'number' &&
        typeof value === 'number'
          ? samePlace(now, value, mode, meta)
          : sameValue(now, value));
      views.push({
        order,
        view: {
          key: declaration.key,
          kind: declaration.kind,
          label: options.label ?? name,
          implicit: declaration.implicit,
          ...(declaration.line === undefined ? {} : { line: declaration.line }),
          group,
          meta,
          value,
          effective: this.#settledAway(runtime, declaration.key, away)
            ? (now as number | boolean | string)
            : null,
          stored: stored !== undefined,
          mode,
          modes,
          ...(waiting === undefined ? {} : { waiting }),
        },
      });
    }
    // (a stable sort: controls of one node stay in the order they were declared)
    return views.sort((a, b) => a.order - b.order).map((entry) => entry.view);
  }

  /**
   * Whether a control's "the parameter is elsewhere" marker should show. It waits a moment, so that a
   * change on its way to being heard, or a value passing through, does not flicker; it goes at once.
   */
  #settledAway(runtime: ScopeRuntime, key: string, away: boolean): boolean {
    if (!away) {
      runtime.differing.delete(key);
      return false;
    }
    if (!this.#realtime) return true;
    const now = performance.now();
    const since = runtime.differing.get(key);
    if (since === undefined) {
      runtime.differing.set(key, now);
      const timer = setTimeout(() => {
        this.#timers.delete(timer);
        if (runtime.differing.has(key)) this.#host.changed();
      }, EFFECTIVE_DELAY_MS + 10);
      this.#timers.add(timer);
      return false;
    }
    return now - since >= EFFECTIVE_DELAY_MS;
  }

  /**
   * Where each of the script's nodes is: its place in the order the script made them, which chain it
   * is part of (nodes joined by connections, directly or through a parameter one modulates), and which
   * of its type it is when the script has several.
   */
  #layout(runtime: ScopeRuntime): Layout {
    const nodes = this.#ownNodes(runtime);
    const index = new Map(nodes.map((node, at) => [node, at]));
    const root = nodes.map((_, at) => at);
    const find = (at: number): number => {
      while (root[at] !== at) at = root[at] = root[root[at]!]!;
      return at;
    };
    const join = (a: number, b: number): void => {
      const ra = find(a);
      const rb = find(b);
      if (ra !== rb) root[Math.max(ra, rb)] = Math.min(ra, rb);
    };
    const firstInsert = new Map<string, number>();
    for (const [at, node] of nodes.entries()) {
      for (const edge of node.outputs) {
        const to = edge.to as unknown as { node?: Node };
        const target = index.get(edge.to as Node) ?? index.get(to.node as Node);
        if (target !== undefined) join(at, target);
      }
      // a bus's inserts are in series inside it, though no edge says so
      const bus = node.insertOf?.name;
      if (bus !== undefined) {
        const first = firstInsert.get(bus);
        if (first === undefined) firstInsert.set(bus, at);
        else join(at, first);
      }
    }
    const chains = new Map<number, number>();
    const perType = new Map<string, number>();
    for (const node of nodes)
      perType.set(node.type, (perType.get(node.type) ?? 0) + 1);
    const seen = new Map<string, number>();
    const placed: Layout['nodes'] = new Map();
    for (const [at, node] of nodes.entries()) {
      const chainRoot = find(at);
      if (!chains.has(chainRoot)) chains.set(chainRoot, chains.size);
      const nth = (seen.get(node.type) ?? 0) + 1;
      seen.set(node.type, nth);
      placed.set(node.id, {
        index: at,
        chain: chains.get(chainRoot)!,
        ordinal: (perType.get(node.type) ?? 0) > 1 ? nth : null,
        bus: node.insertOf?.name ?? null,
      });
    }
    // a bus with no inserts is a chain of its own, after the nodes', in the order asked about
    const bare = new Map<string, number>();
    const bareIndex = (bus: string): number => {
      if (!bare.has(bus)) bare.set(bus, bare.size);
      return bare.get(bus)!;
    };
    return {
      nodes: placed,
      busChain: (bus) => {
        const first = firstInsert.get(bus);
        return first === undefined
          ? chains.size + bareIndex(bus)
          : chains.get(find(first))!;
      },
      busOrder: (bus) => {
        const first = firstInsert.get(bus);
        return first === undefined
          ? nodes.length + bareIndex(bus)
          : first - 0.5;
      },
    };
  }

  /** A bus of the scope by name, without making one: null if the scope has no such bus. */
  #busOf(runtime: ScopeRuntime, name: string): Bus | null {
    const own =
      (name === 'main' && runtime.scope === this.engine.root) ||
      runtime.scope.snapshot().buses.some((bus) => bus.name === name);
    return own ? runtime.scope.bus(name) : null;
  }

  /**
   * How long one step of the scope's sequence lasts at the tempo now, for times shown in steps: the
   * first sequence the script declares a step grid for, else its first sequence, else the transport's
   * own step length.
   */
  #stepSeconds(runtime: ScopeRuntime): number | null {
    const transport = runtime.scope.transport;
    try {
      const declared = runtime.declarations.find(
        (declaration) => declaration.bindings[0]?.type === 'sequence',
      )?.bindings[0];
      const sequence =
        (declared?.type === 'sequence'
          ? transport.get(declared.name)
          : undefined) ?? transport.sequences[0];
      const options = sequence?.options;
      const seconds =
        options?.span !== undefined && sequence && sequence.steps.length > 0
          ? transport.seconds(options.span) / sequence.steps.length
          : transport.seconds(options?.step ?? transport.stepLength);
      return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
    } catch {
      return null;
    }
  }

  /** The waveform editors a script declares, in the order it declared them. */
  waveforms(scopeId: string): WaveformView[] {
    const runtime = this.#scopes.get(scopeId);
    if (!runtime) return [];
    const declarations = runtime.declarations.filter(
      (declaration) => declaration.kind === 'waveform',
    );
    if (declarations.length === 0) return [];
    const controls = new Map(
      this.#controlViews(scopeId, true).map((view) => [view.key, view]),
    );
    const values = valuesOf(this.#host.getDoc(), scopeId);
    const layout = this.#layout(runtime);
    const views: WaveformView[] = [];
    for (const declaration of declarations) {
      const nodeId = declaration.nodes[0];
      const node =
        nodeId === undefined ? undefined : this.sampler(scopeId, nodeId);
      if (!node || nodeId === undefined) continue;
      const params: WaveformView['params'] = {};
      for (const binding of declaration.bindings) {
        if (binding.type !== 'param') continue;
        // whichever declaration has this parameter: the waveform's own part, or a slider the script has
        const key = runtime.claims.get(`${nodeId}/${binding.param}`);
        const view = key === undefined ? undefined : controls.get(key);
        if (view) params[binding.param] = view;
      }
      const ref = node.buffer;
      const soundKey = controlKey(`#${nodeId}`, BUFFER_OPTION);
      views.push({
        key: declaration.key,
        nodeId,
        // its label if the script gave one; else the selector that names it, as written; a sampler with
        // no id is its type, numbered when the script has several
        label:
          declaration.options.label ??
          (node.autoId
            ? `${node.type}${layout.nodes.get(nodeId)?.ordinal ? ` ${layout.nodes.get(nodeId)!.ordinal}` : ''}`
            : `#${nodeId}`),
        ...(declaration.line === undefined ? {} : { line: declaration.line }),
        byPosition: node.autoId,
        sound: ref
          ? {
              key: ref.key,
              state: ref.state,
              duration: ref.duration,
              slices: ref.slices,
            }
          : null,
        choosable: STORED_BUFFER_CHOICE,
        soundStored:
          STORED_BUFFER_CHOICE &&
          typeof values?.controls[soundKey]?.value === 'string',
        soundKey,
        params,
      });
    }
    return views;
  }

  /** A node of a scope's script by id: for drawing its sound and play position, and auditioning it. */
  sampler(scopeId: string, nodeId: string): Node | undefined {
    const runtime = this.#scopes.get(scopeId);
    if (!runtime) return undefined;
    return this.#ownNodes(runtime).find((node) => node.id === nodeId);
  }

  /** The declared step grids, in the order the script declared them. */
  stepGrids(scopeId: string): StepGridView[] {
    const runtime = this.#scopes.get(scopeId);
    if (!runtime) return [];
    const values = valuesOf(this.#host.getDoc(), scopeId);
    const views: StepGridView[] = [];
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
    const doc = this.#host.getDoc();
    const where = (id: string): string =>
      id === PROJECT_SCOPE
        ? 'the project script'
        : `track ${doc.tracks.findIndex((track) => track.id === id) + 1}`;
    const ids = new Map<string, LiveCatalog['ids'][number]>();
    const buses = new Map<string, LiveCatalog['buses'][number]>([
      [
        OUT_BUS,
        {
          name: OUT_BUS,
          description:
            "The track's way out, which Euclip makes for every track: sound sent here passes through the channel strip's level and pan, then to main.",
        },
      ],
    ]);
    const sequences = new Map<string, LiveCatalog['sequences'][number]>();
    // (What cracked-up/editor's catalogFromScope reads, done here: that module comes with the editor,
    // which is only loaded when a script is first shown, and the runner is in the app from the start.)
    for (const runtime of this.#scopes.values()) {
      for (const node of this.#ownNodes(runtime)) {
        if (node.autoId || ids.has(node.id)) continue; // (not ids nobody wrote)
        ids.set(node.id, {
          name: node.id,
          type: node.type,
          description: `${node.type} in ${where(runtime.id)}`,
        });
      }
      for (const bus of runtime.scope.snapshot().buses) {
        if (bus.name === 'main' || buses.has(bus.name)) continue;
        buses.set(bus.name, {
          name: bus.name,
          description: `A bus made by ${where(runtime.id)}.`,
        });
      }
      for (const sequence of runtime.scope.transport.sequences) {
        if (sequence.name === null || sequences.has(sequence.name)) continue;
        sequences.set(sequence.name, {
          name: sequence.name,
          description: `${sequence.steps.length} steps, in ${where(runtime.id)}`,
        });
      }
    }
    return {
      buffers: Object.keys(doc.samples).map((key) => {
        const ref = this.engine.buffers.get(key);
        return {
          key,
          duration: ref?.duration ?? null,
          ...(ref && ref.slices.length > 2
            ? { slices: ref.slices.length - 1 }
            : {}),
        };
      }),
      ids: [...ids.values()],
      buses: [...buses.values()],
      sequences: [...sequences.values()],
    };
  }

  // --- Operations the UI asks for --------------------------------------------------------------------

  /**
   * The operation for pressing a step of a declared grid. An on step goes off; an off step comes
   * back to what it held before (so a step holding 3 is not flattened to 1), or to 1.
   */
  toggleStepOperation(
    scopeId: string,
    name: string,
    index: number,
  ): Operation | null {
    const runtime = this.#scopes.get(scopeId);
    const key = stepGridKey(name);
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

  /**
   * The operation for giving a step of a declared grid a value. 0 is a rest; a value above 0 is what
   * the sequence's callback is handed (`ev.value`), and what the step comes back to after being off.
   */
  setStepOperation(
    scopeId: string,
    name: string,
    index: number,
    value: number,
  ): Operation | null {
    const runtime = this.#scopes.get(scopeId);
    const key = stepGridKey(name);
    const sequence = runtime?.scope.transport.get(name);
    if (
      !runtime ||
      !sequence ||
      !Number.isFinite(value) ||
      !runtime.declarations.some((declaration) => declaration.key === key) ||
      index < 0 ||
      index >= sequence.steps.length
    ) {
      return null;
    }
    const steps = [...sequence.steps];
    steps[index] = value;
    if (value !== 0) {
      const memory = runtime.stepMemory.get(name) ?? [];
      memory[index] = value;
      runtime.stepMemory.set(name, memory);
    }
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
      const declaration = runtime.declarations.find((d) => d.key === key)!;
      // The parameter goes where the control is, by the control's own doing: that is not "the script
      // moved it", now or when the change is heard.
      this.#applying = true;
      try {
        for (const node of this.#reach(runtime, declaration)) {
          node.param(binding.param).set(value);
          runtime.heard.set(heardKey(node, binding.param), value);
        }
      } finally {
        this.#applying = false;
      }
    } else if (binding.type === 'option' && typeof value === 'string') {
      // the sound a sampler plays: changed in place, so what is sounding finishes on the old one
      for (const node of this.#select(runtime, binding.selector)) {
        node.setOption(binding.option, value);
      }
    } else if (binding.type === 'bus' && typeof value === 'number') {
      const bus = this.#busOf(runtime, binding.name);
      if (!bus) return;
      this.#applying = true;
      try {
        bus.gain.set(value);
        runtime.heard.set(busHeardKey(binding.name), value);
      } finally {
        this.#applying = false;
      }
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
    if (this.#applying) return; // the user's own move: already where the control is (see #applyControl)
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
    if (at === null || !this.#realtime) return callback();
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
    const snapshot = runtime.scope.snapshot();
    // Whether anything the script made goes to the track's channel bus: a node connected to it, or a
    // bus of the script's routed to it. (Names resolve outward, so `channel` here is the host's.)
    runtime.sendsToChannel =
      snapshot.graph.edges.some(
        (edge) => 'bus' in edge.to && edge.to.bus === CHANNEL_BUS,
      ) || snapshot.buses.some((bus) => bus.to === CHANNEL_BUS);
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
        message: `stepGrid('${name}') is declared before the sequence is made. Move it below the __.transport.sequence('${name}', …) call.`,
      };
    });
  }

  #metaOf(param: Param, options: ControlOptions): ControlMeta {
    const meta = param.meta;
    if (meta.kind === 'boolean') return { kind: 'boolean' };
    if (meta.kind === 'choice')
      return { kind: 'choice', choices: meta.choices };
    const step = options.step ?? meta.step;
    const min = Math.max(meta.min, options.min ?? meta.min);
    return {
      kind: 'number',
      min,
      max: Math.max(min, Math.min(meta.max, options.max ?? meta.max)),
      unit: meta.unit,
      curve: meta.curve,
      ...(step === undefined ? {} : { step }),
      ...(options.values === undefined ? {} : { values: options.values }),
    };
  }

  // --- A track's way out ----------------------------------------------------------------------------

  /**
   * A track's channel strip: its `out` bus and the pan insert on it. They are in the track's host scope,
   * the parent of the scope its script builds in. A script reaches it by name (`.to('channel')` looks
   * outward through parent scopes) but its selectors, which look inward, never find the pan; and its
   * rebuilds, which only reconcile their own scope, never touch either.
   */
  #applyStrip(track: TrackDocument): void {
    const runtime = this.#scopes.get(track.id);
    if (!runtime) return;
    const out = runtime.host.bus(OUT_BUS);
    out.gain.set(track.level);
    [...out.inserts]
      .find((node) => node.id === HOST_PAN_ID)
      ?.param('pan')
      .set(track.pan);
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
    const track = this.#host
      .getDoc()
      .tracks.find((candidate) => candidate.id === scopeId);
    // The project script builds in the root scope. A track has a scope of its own for Euclip's parts,
    // and its script builds in a child of that.
    const host = track ? this.engine.scope(scopeId) : this.engine.root;
    const scope = track ? host.scope('script') : host;
    const created: ScopeRuntime = {
      id: scopeId,
      scope,
      host,
      lastTried: null,
      built: false,
      sendsToChannel: false,
      error: null,
      declarations: [],
      warnings: [],
      defaults: new Map(),
      heard: new Map(),
      claims: new Map(),
      differing: new Map(),
      errored: new Set(),
      stepMemory: new Map(),
      playheads: new Map(),
      off: [],
    };
    runtime = created;
    this.#scopes.set(scopeId, created);
    if (track) {
      // The track's way out, made by the host: there (and silent) even when the script has never
      // built. Its pan is tagged as the host's, so that nothing a script declares can reach it.
      host
        .bus(OUT_BUS)
        .to('main')
        .insert()
        .panner({
          id: HOST_PAN_ID,
          pan: track.pan,
          tags: { [HOST_TAG]: 'host' },
        });
      host.bus(OUT_BUS).gain.set(track.level);
    }
    created.off.push(
      scope.on('param:changed', (change) =>
        this.#onParamChange(created, change),
      ),
      scope.on('error', (error) => this.#onScopeError(created, error)),
      // a sampler was pointed at another sound: what is drawn of it follows
      scope.on('option:changed', () => this.#host.changed()),
    );
    return created;
  }

  #remove(scopeId: string): void {
    const runtime = this.#scopes.get(scopeId);
    if (!runtime || scopeId === PROJECT_SCOPE) return;
    for (const off of runtime.off) off();
    runtime.host.dispose(); // the script's scope with it
    this.#scopes.delete(scopeId);
  }

  /** The scope's own nodes: what its script made (not other scopes', not the insides of macros). */
  #ownNodes(runtime: ScopeRuntime): Node[] {
    return [...runtime.scope.select('*')].filter(
      (node) =>
        node.scope === runtime.scope &&
        node.parent === null &&
        node.tags[HOST_TAG] === undefined,
    );
  }

  /** The nodes a selector finds, as the script's own `__(selector)` would, without the host's own. */
  #select(runtime: ScopeRuntime, selector: string): Node[] {
    try {
      return [...runtime.scope.$(selector)].filter(
        (node) => node.tags[HOST_TAG] === undefined,
      );
    } catch {
      return [];
    }
  }

  /** Every node a control's parameter bindings reach now. */
  #reach(runtime: ScopeRuntime, declaration: Declaration): Node[] {
    return declaration.bindings.flatMap((binding) =>
      binding.type === 'param'
        ? this.#select(runtime, binding.selector).filter(
            (node) => binding.param in node.params,
          )
        : [],
    );
  }

  /**
   * Brings the engine's buffer store in line with the document's pool: loads what is new (a URL, or
   * the bytes of a file the person added), and gives every sound the slices the document holds for it.
   */
  #loadSamples(doc: ProjectDocument): void {
    for (const [name, source] of Object.entries(doc.samples)) {
      const from =
        source.file !== undefined ? `file:${source.file}` : source.url;
      if (from === undefined) continue;
      if (this.#loadedSamples.get(name) !== from) {
        this.#loadedSamples.set(name, from);
        // not awaited: a sampler without its sound yet is silent, and plays once it arrives
        if (source.file !== undefined) {
          const reading = this.#loadFile(name, source.file).finally(() =>
            this.#reading.delete(reading),
          );
          this.#reading.add(reading);
        } else if (source.url !== undefined) {
          this.engine.buffers.load(source.url, { key: name });
        }
      }
      this.#applySlices(name);
    }
  }

  /**
   * Resolves when every added file being read has been handed to the buffer store (decoding goes on).
   * Scripts run after this: a sampler made before its sound has an entry would look for a URL of that
   * name instead.
   */
  async #filesRead(): Promise<void> {
    await Promise.allSettled([...this.#reading]);
  }

  async #loadFile(name: string, file: string): Promise<void> {
    const have = this.engine.buffers.get(name);
    if (have && have.state === 'ready') return; // (added a moment ago, already decoded)
    const bytes = (await this.#host.readFile?.(file)) ?? null;
    if (this.#loadedSamples.get(name) !== `file:${file}`) return;
    if (!bytes) {
      console.warn(
        `Euclip: the audio of "${name}" is not in this browser's storage.`,
      );
      this.#missing.add(name);
      this.#host.changed();
      return;
    }
    // (decoding detaches the bytes it is given: hand it a copy)
    this.engine.buffers.add(name, bytes.slice(0));
  }

  /** Gives a sound of the pool the slices the document holds for it (none: one slice, the whole sound). */
  #applySlices(name: string): void {
    const ref = this.engine.buffers.get(name);
    const source = this.#host.getDoc().samples[name];
    if (!ref || !source || ref.duration === null) return;
    const wanted = normalizeSlices(
      source.slices ?? [0, ref.duration],
      ref.duration,
    );
    const slices = wanted.length >= 2 ? wanted : [0, ref.duration];
    if (!sameValue([...ref.slices], slices)) {
      this.#settingSlices = true;
      try {
        ref.slices = slices;
      } finally {
        this.#settingSlices = false;
      }
    }
  }

  /**
   * A sound's slices were changed by something other than the document (a script: `ref.slices = …`).
   * They are the sound's, so the document takes them: stored, but not a step to undo.
   */
  #onSlices(ref: BufferRef): void {
    if (this.#settingSlices) return;
    const source = this.#host.getDoc().samples[ref.key];
    if (source) {
      this.#host.dispatch({
        type: 'setSampleSlices',
        name: ref.key,
        slices: [...ref.slices],
      });
    }
    this.#host.changed();
  }

  /** Sounds of the pool whose audio could not be found or read. */
  missingSamples(): string[] {
    const missing = new Set(this.#missing);
    for (const name of Object.keys(this.#host.getDoc().samples)) {
      if (this.engine.buffers.get(name)?.state === 'error') missing.add(name);
    }
    return [...missing];
  }

  /**
   * Plays a sampler now, for the ear: one slice of its sound, or the whole region. The audio must be
   * running (the caller resumes the context inside the user's gesture).
   */
  audition(scopeId: string, nodeId: string, slice?: number): boolean {
    const node = this.sampler(scopeId, nodeId);
    if (!node?.buffer?.buffer) return false;
    node.trigger(slice === undefined ? {} : { slice });
    return true;
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

/** How good a declaration's claim to a parameter is: a compound widget's part, controls(), an explicit control. */
function rankOf(declaration: Declaration): number {
  return declaration.hidden ? 0 : declaration.implicit ? 1 : 2;
}

/**
 * Whether a parameter is where its control is, to the control's own resolution: the same place along
 * its travel in the unit it is in (so a control in whole notes does not call a few cents "elsewhere"),
 * or the same number as near as a 32-bit audio parameter holds one.
 */
function samePlace(
  a: number,
  b: number,
  mode: ModeName,
  meta: NumberMeta,
): boolean {
  if (Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a), Math.abs(b)))
    return true;
  const map = mapping(mode, meta);
  return Math.abs(map.toPosition(a) - map.toPosition(b)) < SAME_PLACE;
}
