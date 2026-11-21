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
  Duration,
  Engine,
  GraphError,
  Node,
  NodeTypeInfo,
  Param,
  ParamChange,
  Scope,
  Sequence,
  SequenceEvent,
} from 'cracked-up';
import {
  compile,
  currentScriptLine,
  type Program,
} from 'client-v2/audio/compile';
import { normalizeSlices } from 'cracked-up/util';
import { buildModel, readScope } from 'cracked-up/inspect';
import { buildChainGraph, type ChainGraph } from 'client-v2/audio/chain-view';
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
  familyOf,
  isModeName,
  mapping,
  MODE_LABELS,
  nearestSync,
  type ModeName,
  type NumberMeta,
} from 'client-v2/controls/modes';
import {
  createControlApi,
  fitSteps,
  gridLength,
  type ControlHost,
} from 'client-v2/controls/script-api';
import { sameValue, type Operation } from 'client-v2/project/operations';
import { sourceId } from 'client-v2/project/pool';
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
  /**
   * The id of the source node (a sampler, an oscillator, a synth macro) this control is for, when it is
   * for exactly one: the source tab shows it with that source's editor, and the processors tab does not.
   * Null for the rest.
   */
  source: string | null;
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
  /**
   * The units as its menu lists them. Mostly one per mode; a sampler's speed has a "sequence sync"
   * item for every named sequence of its script, and `choice` says which is in use.
   */
  choices: ModeChoice[];
  choice: string;
  /**
   * For a control whose parameter can glide (a continuous audio parameter, in a unit that is not
   * stepped): how long the parameter takes to get to where the control is put. Absent for the rest.
   */
  glide?: GlideView;
  /**
   * A number control that cannot glide: why, in a few words, for its menu's disabled Glide entry.
   * Absent where it can (see `glide`), and for a toggle or a select.
   */
  glideWhy?: string;
  /**
   * The ways the control can hold its value, as its menu lists them: a single value, or one for every
   * step of a named sequence of the script (an item per sequence). Empty where that is not offered
   * (a toggle, a select, a control with no parameter, a script with no named sequence).
   */
  stepChoices: ModeChoice[];
  stepChoice: string;
  /** Per step is not offered now, and why (a speed synced to a sequence holds a multiplier): for its disabled menu entry */
  stepWhy?: string;
  /** It has a value for every step of a sequence (see `LaneView`). Absent: a single value. */
  perStep?: {
    /** the sequence, as chosen */
    sequence: string;
    /** the sequence is not in the script now: the control is at its single value meanwhile */
    missing: boolean;
  };
  /** its range depends on something not there yet (a sample still loading): what, in words */
  waiting?: string;
}

export interface GlideView {
  /** seconds, as things stand: what the project holds, else the script's, else 0 */
  seconds: number;
  /** the project holds a time of its own for it (so there is something to reset) */
  stored: boolean;
  /** it follows a control of the script's own (`{ glide: thatControl }`): that control's label */
  follows?: string;
}

/**
 * A per-step control as a lane under its sequence's grid: a bar for every step, each the control's
 * value on that step.
 */
export interface LaneView {
  /** the control's key */
  key: string;
  label: string;
  /** the control as its row would show it: its unit, range and mode are the lane's */
  control: ControlView;
  /** a value for each step of the sequence, in the parameter's own terms */
  values: number[];
}

const SINGLE = 'single';
const PER_STEP = 'per-step';
const stepChoice = (sequence: string): string => `${PER_STEP}:${sequence}`;

/** One item of a control's unit menu. */
export interface ModeChoice {
  /** what to hand `modeOperations`: a mode's name, or `sequence-sync:` and a sequence's name */
  id: string;
  label: string;
}

/**
 * How a parameter follows a control being moved: glided to over this long from wherever it has got
 * to (cracked-up's `set` with `glide`), in place of a step on every movement of the pointer, which is
 * heard as a crackle. Short enough not to be heard as a lag, long enough to cover the time between
 * two movements at 60 a second.
 */
export const FOLLOW_SECONDS = 0.02;
const FOLLOW = { glide: FOLLOW_SECONDS };
/** Seconds to fade the output over before everything is silenced: short, but enough to avoid a click. */
const SILENCE_FADE = 0.02;

/** The scope and the buffer Euclip hears a sound with (`ProjectRunner.hear`): not a project's. */
const HEAR_SCOPE = '~hear';
const HEAR_KEY = '~hear';
/** How many decoded sounds are kept beyond those the project uses. */
const DECODED_KEPT = 32;

const SYNC = 'sequence-sync';
const syncChoice = (sequence: string): string => `${SYNC}:${sequence}`;

/** A speed synced to a sequence, as things stand: which sequence, and what a multiplier of 1 is as a speed. */
interface Sync {
  /** the sequence's name, as chosen or (with none chosen) the script's first; null when there is none */
  sequence: string | null;
  /** the sound's length over the sequence's; null while there is nothing to sync to (the speed is then 1) */
  factor: number | null;
  /** with no factor: what is missing, in words */
  why?: string;
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
  /** the dials of the generator last used on it, as stored (read with controls/generators.ts) */
  generator?: Record<string, unknown>;
  /** how many steps the script gives it, and whether the grid's own Length is set (the project's) */
  scriptLength: number;
  lengthStored: boolean;
  /** its step length now, the script's, and whether the grid's own is set; null: the transport's */
  step: string | null;
  scriptStep: string | null;
  stepStored: boolean;
  /** made with `span` (so many steps spread over a length): its step length is not one to choose */
  span: string | null;
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
  /** whether the sound can be chosen here and kept in the project (always, now: kept for callers that ask) */
  choosable: boolean;
  /** the project holds a choice of sound for it (so Reset has something to forget) */
  soundStored: boolean;
  /**
   * The person's choice can be forgotten for the sound the script names: there is a choice, and the
   * script writes a `buffer:` (a script that names no sound has nothing to go back to).
   */
  soundDefault?: boolean;
  /** the key the choice of sound is stored under */
  soundKey: string;
  /** the controls it is a view over, by parameter name: the same ones a slider for each would be */
  params: Partial<Record<string, ControlView>>;
}

/** A synth editor a script declares (an oscillator or a synth macro): see `ProjectRunner#synths`. */
export interface SynthView {
  /** the declaration's key: the node's id and `synth` */
  key: string;
  nodeId: string;
  /** the node's type: sine, saw, monosynth */
  type: string;
  label: string;
  line?: number;
  byPosition: boolean;
  /** the parameter the keyboard sets, or null (a synth macro is played by note; some sources have no pitch) */
  pitchParam: string | null;
  /** the control the keyboard sets: the script's own for that parameter, else the one synth() made */
  pitch: ControlView | null;
  /** a noise source: it has no editor, only a graphic (and whatever controls the script declared for it) */
  noise: boolean;
  /** notes are given to it as the pitch of its trigger (a synth macro): the keyboard plays, and stores nothing */
  playsNote: boolean;
}

/** One source editor of a script, as the source tab lists them. */
export type SourceView =
  | {
      kind: 'waveform';
      key: string;
      nodeId: string;
      label: string;
      waveform: WaveformView;
    }
  | {
      kind: 'synth';
      key: string;
      nodeId: string;
      label: string;
      synth: SynthView;
    };

export interface RunnerHost {
  /** The current document. */
  getDoc(): ProjectDocument;
  /** Applies an operation that came from a script (`control.set(…)`): stored, but not a step to undo. */
  dispatch(op: Operation): void;
  /** Something the UI shows has changed: controls, values, errors. */
  changed(): void;
  /** A playhead moved. Separate, because it happens on every step. */
  playheadMoved(): void;
  /** A step that sounds (not a rest) is being heard in a scope. Nothing is tracked: it is for things drawn by hand. */
  stepTriggered?(scopeId: string): void;
  /** The bytes of a sound the person added (project/storage.ts), or null if they are gone. */
  readFile?(id: string): Promise<ArrayBuffer | null>;
  /** Where the audio of a file of the sound library is fetched from (library/client.ts). */
  libraryUrl?(path: string): string;
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
  /** the value last given to a step of each grid: what a new step takes */
  stepLast: Map<string, number>;
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
        // (a single sample is the stand-in a missing file's name is given: not its audio)
        const real = ref.buffer !== null && ref.buffer.length > 1;
        if (real) this.#missing.delete(ref.key);
        const from = this.#loadedSamples.get(ref.key);
        if (from !== undefined && ref.buffer && real) {
          this.#decoded.set(from, ref.buffer);
        }
        this.#applySlices(ref.key);
        // (a speed synced to a sequence needs the sound's length: here it is)
        for (const runtime of this.#scopes.values()) this.#resync(runtime);
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
    for (const held of this.#stepListeners.values()) held.off();
    this.#stepListeners.clear();
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
      (declaration.kind === 'waveform' || declaration.kind === 'synth'
        ? []
        : declaration.bindings
      ).flatMap((binding) =>
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
        // A source has one editor (waveform or synth) and a sequence one grid. One the script wrote
        // (waveform('#kick'), stepGrid('steps')) is used instead of the one controls() would give,
        // whichever comes first; of two it wrote, the first waveform line stands (a later
        // waveform('sampler') that also finds the sampler adds nothing, and does not undo its label).
        const same = declared.get(declaration.key);
        if (
          same &&
          (declaration.kind === 'waveform' ||
            declaration.kind === 'synth' ||
            declaration.kind === 'stepGrid')
        ) {
          if (declaration.implicit) return false;
          if (declaration.kind !== 'stepGrid' && !same.implicit) return false;
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
      typeInfo: (type) => this.#typeInfo(type),
      moved: (key, value, glide) =>
        this.#movedByScript(runtime, key, value, glide ?? 0),
      gridShape: (key) => {
        const options = valuesOf(this.#host.getDoc(), scopeId)?.controls[key]
          ?.options;
        return {
          ...(typeof options?.length === 'number'
            ? { length: options.length }
            : {}),
          ...(typeof options?.step === 'string' ? { step: options.step } : {}),
        };
      },
      perStep: (key) => {
        const declaration =
          declared.get(key) ??
          runtime.declarations.find((candidate) => candidate.key === key);
        const per = declaration && this.#perStepOf(runtime, declaration);
        if (!declaration || !per?.found) return null;
        const values = this.#stepValues(runtime, declaration, per.sequence);
        const at = this.#lastStep.get(`${runtime.id}/${per.sequence}`) ?? 0;
        return { value: values[at] ?? values[0] ?? 0 };
      },
      glide: (key) =>
        this.#controlViews(runtime.id, true).find((view) => view.key === key)
          ?.glide?.seconds ?? 0,
      sync: (key) => {
        const find = (): Declaration | undefined =>
          declared.get(key) ??
          runtime.declarations.find((candidate) => candidate.key === key);
        const first = find();
        if (!first || !this.#syncOf(runtime, first)) return null;
        // (asked again at every use: a callback's set() next week is at that day's tempo)
        return (multiplier) => {
          const declaration = find();
          const sync = declaration && this.#syncOf(runtime, declaration);
          return declaration && sync
            ? this.#syncedSpeed(runtime, declaration, sync, multiplier)
            : multiplier;
        };
      },
    };
    try {
      const result = await runtime.scope.build((api) => {
        const controls = createControlApi(api, host, currentScriptLine);
        program(api, controls.functions);
        controls.finish();
      });
      runtime.built = true;
      runtime.declarations = [...declared.values()];
      // (every sequence is made by now, wherever in the script: synced speeds are put right)
      this.#resync(runtime);
      this.#reconcileStepListeners();
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
    // (undo, redo, another project: a level that changes under a sound moves there, it does not jump)
    for (const track of doc.tracks) this.#applyStrip(track, true);
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
        // a sequence lasts a different time now: speeds synced to one follow, with nothing stored
        for (const runtime of this.#scopes.values()) this.#resync(runtime);
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
        if (track) this.#applyStrip(track, true);
        break;
      }
      case 'addTrack':
        void this.run(op.track.id);
        break;
      case 'removeTrack':
        this.#remove(op.id);
        break;
      case 'renameSample':
      case 'duplicateSample':
        // (names scripts and samplers know sounds by have changed: every script runs again)
        this.engine.buffers.delete(op.type === 'renameSample' ? op.from : '');
        this.#loadedSamples.delete(op.type === 'renameSample' ? op.from : '');
        void this.sync();
        break;
      case 'setSample':
      case 'addSample':
      case 'removeSample':
        this.#loadSamples(doc);
        break;
      case 'setSampleSlices':
        if (!fromScript) this.#applySlices(op.name);
        break;
      case 'setControlOptions': {
        // (a unit that is "synced to a sequence" changes what the stored number means)
        const runtime = this.#scopes.get(op.scope);
        if (runtime) {
          // (a grid's length or step length: the sequence takes it, and what follows a sequence follows)
          this.#applyGridShape(runtime, op.key);
          this.#resync(runtime);
        }
        // (a control may have gone per step, or back, or had a bar moved)
        this.#reconcileStepListeners();
        break;
      }
      case 'setScript':
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

  /**
   * The graph the running version of a scope's script made, arranged for the Signal chain tab. Null
   * while nothing has built. It reads the live scope (the library's own model of it), so it is complete
   * and true whether or not Euclip can edit the script that made it.
   */
  chainGraph(scopeId: string): ChainGraph | null {
    const runtime = this.#scopes.get(scopeId);
    if (!runtime?.built) return null;
    const { source } = readScope(runtime.scope, () => false);
    // (a track's script scope has no children of its own; the project's root has every track's scope: not drawn here)
    return buildChainGraph(
      buildModel({ ...source, children: [] }, () => false),
    );
  }

  /** A number parameter's base value on a node of a scope's script, as it is now; undefined if there is none. */
  paramValue(
    scopeId: string,
    nodeId: string,
    param: string,
  ): number | undefined {
    const runtime = this.#scopes.get(scopeId);
    const node = runtime ? this.#select(runtime, `#${nodeId}`)[0] : undefined;
    const value = node?.param(param).value;
    return typeof value === 'number' ? value : undefined;
  }

  /** A node of a scope's running script, by id (for tapping its output); undefined if there is none. */
  nodeById(scopeId: string, nodeId: string): Node | undefined {
    const runtime = this.#scopes.get(scopeId);
    return runtime ? this.#select(runtime, `#${nodeId}`)[0] : undefined;
  }

  /** The node types the library offers, for the picker that adds one to a chain. */
  nodeTypes(): readonly NodeTypeInfo[] {
    return this.engine.registry.list();
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
    return this.#controlViews(scopeId, false).filter(
      (view) => view.source === null,
    );
  }

  /** Every declared control, sources' included: what `controls` and `sourceControls` split between the two tabs. */
  allControls(scopeId: string): ControlView[] {
    return this.#controlViews(scopeId, false);
  }

  /** The controls of one source node, as the source tab shows them with its editor. */
  sourceControls(scopeId: string, nodeId: string): ControlView[] {
    return this.#controlViews(scopeId, false).filter(
      (view) => view.source === nodeId,
    );
  }

  /**
   * Whether a node is a source of sound, by what the library says its type is: category 'source'
   * (sampler, the oscillators, noise), or a synth macro (category 'synth': a macro that makes sound
   * from triggers and takes none in). The library does not say whether a macro of another category has
   * an audio input, so one of those is not told apart from an effect: it stays under processors.
   */
  isSource(node: Node): boolean {
    return this.#typeInfo(node.type)?.source === true;
  }

  #typeInfo(
    type: string,
  ): { source: boolean; macro: boolean; pitchTrigger: boolean } | null {
    try {
      const info = this.engine.registry.describe(type);
      return {
        source:
          info.category === 'source' ||
          (info.isMacro && info.category === 'synth'),
        macro: info.isMacro,
        pitchTrigger: info.isMacro && 'pitch' in info.triggerOptions,
      };
    } catch {
      return null;
    }
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
        declaration.kind === 'synth' ||
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
      let source: string | null = null;
      let waiting: string | undefined;
      let shown = (value: StoredValue): StoredValue => value;
      /** the library can sweep the parameter (an audio-rate number) */
      let sweepable = false;
      if (binding.type === 'param') {
        const nodes = this.#select(runtime, binding.selector);
        const node = nodes[0];
        if (!node || !(binding.param in node.params)) continue;
        const param = node.param(binding.param);
        sweepable = param.meta.kind === 'number' && param.meta.rate === 'audio';
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
          if (this.isSource(node)) source = node.id;
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
        sweepable = true;
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
      let value = shown(raw) as number | boolean | string;
      // A stored value outside the range the script gives now (it was narrowed since) is shown at the
      // nearest end, as the sound is (see the script side). The project still holds what it held, until
      // the person moves the control.
      // (not a place in a sound: its range is the sound's, and what it is held to is the sampler's to say)
      if (
        meta.kind === 'number' &&
        meta.duration === undefined &&
        typeof value === 'number'
      ) {
        value = Math.min(meta.max, Math.max(meta.min, value));
      }
      const modes = meta.kind === 'number' ? availableModes(meta) : [];
      const wanted = state?.options?.mode ?? options.mode;
      let mode =
        isModeName(wanted) && modes.includes(wanted)
          ? wanted
          : meta.kind === 'number'
            ? defaultMode(meta)
            : 'linear';
      let now =
        live === undefined || Array.isArray(live)
          ? undefined
          : (shown(live) as number | boolean | string);
      let away =
        now !== undefined &&
        !(meta.kind === 'number' &&
        typeof now === 'number' &&
        typeof value === 'number'
          ? samePlace(now, value, mode, meta)
          : sameValue(now, value));
      // The unit menu: one item per mode, and for a sampler's speed a "sequence sync" item for every
      // named sequence of this script (one sequence: just "Sequence sync").
      const choices: ModeChoice[] = modes.map((id) => ({
        id,
        label: MODE_LABELS[id],
      }));
      let choice: string = mode;
      // (a speed is synced to a sequence or has a value for every step, not both: where it has the
      // second, the first is not offered, and not applied)
      const perStep = this.#perStepOf(runtime, declaration) !== null;
      const sync =
        binding.type === 'param' ? this.#syncOf(runtime, declaration) : null;
      if (
        binding.type === 'param' &&
        !perStep &&
        this.#isSpeed(runtime, declaration)
      ) {
        const names = this.#sequenceNames(runtime);
        for (const sequence of names) {
          choices.push({
            id: syncChoice(sequence),
            label:
              names.length === 1
                ? MODE_LABELS[SYNC]
                : `${MODE_LABELS[SYNC]}: ${sequence}`,
          });
        }
        if (names.length > 0) modes.push(SYNC);
      }
      if (sync) {
        // The control holds the multiplier; the parameter is at the speed that makes at this tempo.
        mode = SYNC;
        if (!modes.includes(SYNC)) modes.push(SYNC);
        value = typeof stored === 'number' ? nearestSync(stored) : 1;
        choice = sync.sequence === null ? SYNC : syncChoice(sync.sequence);
        if (!choices.some((item) => item.id === choice)) {
          // (the sequence it was synced to is gone: the choice is kept, and says so)
          choices.push({
            id: choice,
            label:
              sync.sequence === null
                ? MODE_LABELS[SYNC]
                : `${MODE_LABELS[SYNC]}: ${sync.sequence} (missing)`,
          });
        }
        const expected = this.#syncedSpeed(runtime, declaration, sync, value);
        away =
          typeof live === 'number' &&
          Math.abs(live - expected) > 1e-6 * Math.max(1, expected);
        now =
          away && typeof live === 'number'
            ? nearestSync(sync.factor ? live / sync.factor : live)
            : value;
        if (sync.why !== undefined) waiting = sync.why;
      }
      // Glide is for a continuous audio parameter. A unit that moves in whole steps (stepped, semitones,
      // slices, a synced speed) jumps; notes do not: the parameter still glides from note to note.
      const glideWhy: string | undefined =
        meta.kind !== 'number'
          ? undefined
          : binding.type !== 'param' && binding.type !== 'bus'
            ? 'Controls no parameter, so nothing to glide'
            : !sweepable || meta.duration !== undefined
              ? 'Set per trigger; cannot glide'
              : mode !== 'note' && mapping(mode, meta).discrete
                ? 'This parameter changes in steps'
                : undefined;
      views.push({
        order,
        view: {
          key: declaration.key,
          kind: declaration.kind,
          label: options.label ?? name,
          implicit: declaration.implicit,
          ...(declaration.line === undefined ? {} : { line: declaration.line }),
          group,
          source,
          meta,
          value,
          effective: this.#perStepOf(runtime, declaration)?.found
            ? null // (its parameter is wherever its lane has put it: that is the control's own doing)
            : this.#settledAway(runtime, declaration.key, away)
              ? (now as number | boolean | string)
              : null,
          stored: stored !== undefined,
          mode,
          modes,
          choices,
          choice,
          ...this.#stepChoices(runtime, declaration, meta),
          ...(meta.kind === 'number'
            ? glideWhy === undefined
              ? { glide: this.#glideOf(runtime, values, declaration) }
              : { glideWhy }
            : {}),
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
        choosable: true,
        soundStored: typeof values?.controls[soundKey]?.value === 'string',
        ...this.#soundDefault(runtime, soundKey),
        soundKey,
        params,
      });
    }
    return views;
  }

  /** The synth editors a script declares, in the order it declared them. */
  synths(scopeId: string): SynthView[] {
    const runtime = this.#scopes.get(scopeId);
    if (!runtime) return [];
    const declarations = runtime.declarations.filter(
      (declaration) => declaration.kind === 'synth',
    );
    if (declarations.length === 0) return [];
    const controls = new Map(
      this.#controlViews(scopeId, true).map((view) => [view.key, view]),
    );
    const layout = this.#layout(runtime);
    const views: SynthView[] = [];
    for (const declaration of declarations) {
      const nodeId = declaration.nodes[0];
      const node =
        nodeId === undefined ? undefined : this.sampler(scopeId, nodeId);
      if (!node || nodeId === undefined) continue;
      const binding = declaration.bindings[0];
      const param = binding?.type === 'param' ? binding.param : null;
      const key =
        param === null ? undefined : runtime.claims.get(`${nodeId}/${param}`);
      const info = this.#typeInfo(node.type);
      views.push({
        key: declaration.key,
        nodeId,
        type: node.type,
        label:
          declaration.options.label ??
          (node.autoId
            ? `${node.type}${layout.nodes.get(nodeId)?.ordinal ? ` ${layout.nodes.get(nodeId)!.ordinal}` : ''}`
            : `#${nodeId}`),
        ...(declaration.line === undefined ? {} : { line: declaration.line }),
        byPosition: node.autoId,
        pitchParam: param,
        pitch: key === undefined ? null : (controls.get(key) ?? null),
        noise: node.type === 'noise',
        playsNote: info?.pitchTrigger ?? false,
      });
    }
    return views;
  }

  /**
   * Every source editor the script declares (waveforms and synths) in the order it declared them: what
   * the source tab lists.
   */
  sources(scopeId: string): SourceView[] {
    const runtime = this.#scopes.get(scopeId);
    if (!runtime) return [];
    const order = new Map(
      runtime.declarations.map((declaration, at) => [declaration.key, at]),
    );
    const all: SourceView[] = [
      ...this.waveforms(scopeId).map((view): SourceView => ({
        kind: 'waveform',
        key: view.key,
        nodeId: view.nodeId,
        label: view.label,
        waveform: view,
      })),
      ...this.synths(scopeId).map((view): SourceView => ({
        kind: 'synth',
        key: view.key,
        nodeId: view.nodeId,
        label: view.label,
        synth: view,
      })),
    ];
    return all.sort(
      (a, b) => (order.get(a.key) ?? 0) - (order.get(b.key) ?? 0),
    );
  }

  // --- Playing a source for the ear -------------------------------------------------------------------

  /** What a held note started: the nodes to release, by `scope/node`. */
  readonly #held = new Map<string, Node[]>();

  /**
   * Starts a note on a source and holds it until `releaseNote`.
   *
   * A synth macro is triggered with the note's MIDI number as its `pitch`. An oscillator has its pitch
   * parameter set to `hz` and every triggerable node from it on is triggered: the oscillator itself (a
   * closed gate opens) and what follows it (an envelope). On release the same are released, except an
   * oscillator whose gate is open (the default) or that has an envelope after it: releasing it would
   * close a gate the script left open, silencing it for good (the envelope's release is the note's end).
   * So an oscillator with an open gate and nothing to shape it is sounding already and the key only
   * sets its pitch. The audio must be running (see AudioService#playNote).
   */
  playNote(
    scopeId: string,
    nodeId: string,
    note: { midi: number; hz: number; param: string | null },
  ): boolean {
    const runtime = this.#scopes.get(scopeId);
    const node = this.sampler(scopeId, nodeId);
    if (!runtime || !node) return false;
    this.releaseNote(scopeId, nodeId);
    const info = this.#typeInfo(node.type);
    const held: Node[] = [];
    if (info?.pitchTrigger) {
      node.trigger({ pitch: note.midi });
      held.push(node);
    } else {
      if (note.param !== null && note.param in node.params) {
        node.param(note.param).set(note.hz, FOLLOW);
      }
      const chain = this.#triggerChain(node);
      for (const next of chain) next.trigger({});
      const shaped = chain.length > 1;
      const closed =
        runtime.scope.describe().nodes.find((data) => data.id === nodeId)
          ?.init?.['gate'] === 'closed';
      for (const next of chain) {
        if (next === node && (shaped || !closed)) continue;
        held.push(next);
      }
    }
    this.#held.set(`${scopeId}/${nodeId}`, held);
    return true;
  }

  /** Ends the note `playNote` started. */
  releaseNote(scopeId: string, nodeId: string): void {
    const key = `${scopeId}/${nodeId}`;
    for (const node of this.#held.get(key) ?? []) {
      if (node.disposed) continue;
      try {
        node.release({});
      } catch {
        // (nothing sounding)
      }
    }
    this.#held.delete(key);
  }

  /** The node and the triggerable nodes after it, following its connections (an envelope, a gate). */
  #triggerChain(start: Node): Node[] {
    const found: Node[] = [];
    const seen = new Set<Node>();
    const visit = (node: Node, depth: number): void => {
      if (seen.has(node) || depth > 12) return;
      seen.add(node);
      const info = this.#triggerable(node.type);
      if (info) found.push(node);
      for (const edge of node.outputs) {
        const to = edge.to as Partial<Node>;
        if (typeof to.type === 'string' && typeof to.trigger === 'function') {
          visit(to as Node, depth + 1);
        }
      }
    };
    visit(start, 0);
    return found;
  }

  #triggerable(type: string): boolean {
    try {
      const info = this.engine.registry.describe(type);
      return info.triggerable && info.category !== 'io';
    } catch {
      return false;
    }
  }

  #soundDefault(
    runtime: ScopeRuntime,
    soundKey: string,
  ): { soundDefault?: boolean } {
    const doc = this.#host.getDoc();
    if (
      typeof valuesOf(doc, runtime.id)?.controls[soundKey]?.value !== 'string'
    ) {
      return {};
    }
    // (The library keeps no record a host can read of the options a node was made with, so whether
    // the script names a sound is read from its text.)
    const script =
      runtime.id === PROJECT_SCOPE
        ? doc.script
        : (doc.tracks.find((track) => track.id === runtime.id)?.script ?? '');
    return /\bbuffer\s*:/.test(script) ? { soundDefault: true } : {};
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
        ...(values?.controls[declaration.key]?.options?.generator
          ? { generator: values.controls[declaration.key]!.options!.generator }
          : {}),
        playhead: runtime.playheads.get(binding.name) ?? null,
        disabled: runtime.errored.has(binding.name),
        view: declaration.options.view ?? 'toggles',
        ...(declaration.line === undefined ? {} : { line: declaration.line }),
        scriptLength:
          declaration.options.sequenceShape?.length ?? sequence.steps.length,
        lengthStored:
          typeof values?.controls[declaration.key]?.options?.length ===
          'number',
        step:
          sequence.options.step === undefined
            ? null
            : String(sequence.options.step),
        scriptStep: declaration.options.sequenceShape?.step ?? null,
        stepStored:
          typeof values?.controls[declaration.key]?.options?.step === 'string',
        span: declaration.options.sequenceShape?.span ?? null,
      });
    }
    return views;
  }

  /**
   * A grid's length or step length was set (or forgotten) on the grid: the sequence takes it now,
   * keeping its place in the bar. What is set wins over the script's; with nothing set the script's
   * own apply again, which is a matter of running the script.
   */
  #applyGridShape(runtime: ScopeRuntime, key: string): void {
    const declaration = runtime.declarations.find((d) => d.key === key);
    const binding = declaration?.bindings[0];
    const scripted = declaration?.options.sequenceShape;
    if (!declaration || binding?.type !== 'sequence' || !scripted) return;
    const sequence = runtime.scope.transport.get(binding.name);
    if (!sequence) return;
    const state = valuesOf(this.#host.getDoc(), runtime.id)?.controls[key];
    const length = gridLength(state?.options?.length, scripted.length);
    const wantStep =
      scripted.span === undefined ? (state?.options?.step ?? null) : null;
    const nowStep =
      sequence.options.step === undefined
        ? null
        : String(sequence.options.step);
    const lengthSame = sequence.steps.length === length;
    if (wantStep === null && nowStep !== (scripted.step ?? null)) {
      // (back to the script's step length: only the script says what that is)
      void this.run(runtime.id, true);
      return;
    }
    if (lengthSame && (wantStep === null || wantStep === nowStep)) return;
    const stored = state?.value;
    const steps = Array.from({ length }, (_, index) =>
      Array.isArray(stored)
        ? (stored[index] ?? 0)
        : (sequence.steps[index] ?? 0),
    );
    sequence.update({
      steps,
      ...(wantStep === null ? {} : { step: wantStep as Duration }),
    });
    runtime.stepMemory.delete(binding.name);
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
      runtime.stepLast.set(name, current);
      steps[index] = 0;
    } else {
      // what it held before; else the note (or slice) last used on this grid, so a tapped step on a
      // track that plays its steps' values as notes is not note 1; else 1
      steps[index] =
        memory[index] ||
        runtime.stepLast.get(name) ||
        [...sequence.steps].reverse().find((value) => value > 0) ||
        1;
      runtime.stepLast.set(name, steps[index]);
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
      runtime.stepLast.set(name, value);
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
      const sync = this.#syncOf(runtime, declaration);
      if (sync && typeof value === 'number') {
        // the control holds a multiplier: the parameter gets the speed that is at this tempo
        value = this.#syncedSpeed(runtime, declaration, sync, value);
      }
      // The parameter goes where the control is, by the control's own doing: that is not "the script
      // moved it", now or when the change is heard.
      this.#applying = true;
      try {
        // A control on a continuous parameter is followed as a fader is (the library glides the
        // parameters that can, and sets the others). One that moves in whole steps of its unit
        // (stepped, notes, semitones, slices, a synced speed) jumps, as do a toggle's and a select's.
        const how =
          typeof value === 'number' ? this.#howFor(runtime, key) : undefined;
        for (const node of this.#reach(runtime, declaration)) {
          node.param(binding.param).set(value, how);
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
      this.#resync(runtime); // (another sound, another length)
    } else if (binding.type === 'bus' && typeof value === 'number') {
      const bus = this.#busOf(runtime, binding.name);
      if (!bus) return;
      this.#applying = true;
      try {
        bus.gain.set(value, this.#howFor(runtime, key) ?? FOLLOW);
        runtime.heard.set(busHeardKey(binding.name), value);
      } finally {
        this.#applying = false;
      }
    } else if (binding.type === 'sequence' && Array.isArray(value)) {
      const sequence = runtime.scope.transport.get(binding.name);
      sequence?.update({ steps: fitSteps(value, sequence.steps) });
    }
  }

  /** How long a control's parameter takes to get where the control is put, as things stand. */
  #glideOf(
    runtime: ScopeRuntime,
    values: ScopeValues | null | undefined,
    declaration: Declaration,
  ): GlideView {
    const from = declaration.options.glideFrom;
    if (from !== undefined) {
      // a control of the script's own says, read at every move: what the project holds for it, else
      // where it starts
      const other = runtime.declarations.find((d) => d.key === from);
      const held = values?.controls[from]?.value;
      const value =
        typeof held === 'number'
          ? held
          : typeof other?.options.default === 'number'
            ? other.options.default
            : (other?.options.min ?? 0);
      return {
        seconds: Math.max(0, Number.isFinite(value) ? value : 0),
        stored: false,
        follows: other?.options.label ?? from,
      };
    }
    const stored = values?.controls[declaration.key]?.options?.glide;
    const seconds =
      typeof stored === 'number' ? stored : (declaration.options.glide ?? 0);
    return {
      seconds: Math.max(0, Number.isFinite(seconds) ? seconds : 0),
      stored: typeof stored === 'number',
    };
  }

  /**
   * How a control's parameter is to follow the control: over the glide the control has, when it has
   * one; else over the short time that only takes the steps out of a moving fader; and at once for a
   * control that jumps (see `#inSteps`).
   */
  #howFor(runtime: ScopeRuntime, key: string): { glide: number } | undefined {
    const view = this.#controlViews(runtime.id, true).find(
      (candidate) => candidate.key === key,
    );
    if (!view || view.meta.kind !== 'number') return undefined;
    const jumps =
      view.meta.duration !== undefined ||
      mapping(view.mode, view.meta).discrete;
    if (view.glide === undefined) {
      // (a sampler's places, a stepped unit: they jump. A control-rate number is the library's to set
      // at once, whatever it is given)
      return jumps ? undefined : FOLLOW;
    }
    if (view.glide.seconds > 0) return { glide: view.glide.seconds };
    // (notes with no glide of their own jump from note to note)
    return jumps ? undefined : FOLLOW;
  }

  // --- A value for every step ------------------------------------------------------------------------

  /**
   * Whether a control holds a value for every step of a sequence, and of which: by the person's choice,
   * else by the script's `perStep`. Null for a single value. Only a number control on a parameter.
   */
  #perStepOf(
    runtime: ScopeRuntime,
    declaration: Declaration,
  ): { sequence: string; found: boolean } | null {
    const binding = declaration.bindings[0];
    if (binding?.type !== 'param') return null;
    if (declaration.kind !== 'slider' && declaration.kind !== 'knob')
      return null;
    const chosen = valuesOf(this.#host.getDoc(), runtime.id)?.controls[
      declaration.key
    ]?.options?.perStep;
    const wanted = chosen ?? declaration.options.perStep;
    if (wanted === undefined || wanted === false) return null;
    const sequence =
      typeof wanted === 'string' ? wanted : this.#sequenceNames(runtime)[0];
    if (sequence === undefined) return null;
    return {
      sequence,
      found: runtime.scope.transport.get(sequence) !== undefined,
    };
  }

  /** A per-step control's values, fitted to its sequence as it is now: kept as far as they go, the rest its single value. */
  #stepValues(
    runtime: ScopeRuntime,
    declaration: Declaration,
    sequence: string,
  ): number[] {
    const state = valuesOf(this.#host.getDoc(), runtime.id)?.controls[
      declaration.key
    ];
    const kept = state?.options?.stepValues ?? [];
    const single = this.#singleValue(runtime, declaration);
    const length = runtime.scope.transport.get(sequence)?.steps.length ?? 0;
    return Array.from({ length }, (_, index) => {
      const value = kept[index];
      return typeof value === 'number' && Number.isFinite(value)
        ? value
        : single;
    });
  }

  /** The control's single value: what the project holds, else what the script gives the parameter. */
  #singleValue(runtime: ScopeRuntime, declaration: Declaration): number {
    const stored = valuesOf(this.#host.getDoc(), runtime.id)?.controls[
      declaration.key
    ]?.value;
    if (typeof stored === 'number') return stored;
    const fallback = runtime.defaults.get(declaration.key);
    if (typeof fallback === 'number') return fallback;
    const binding = declaration.bindings[0];
    const node =
      binding?.type === 'param'
        ? this.#select(runtime, binding.selector)[0]
        : undefined;
    const value =
      binding?.type === 'param' ? node?.param(binding.param).value : 0;
    return typeof value === 'number' ? value : 0;
  }

  #stepChoices(
    runtime: ScopeRuntime,
    declaration: Declaration,
    meta: ControlMeta,
  ): Pick<ControlView, 'stepChoices' | 'stepChoice' | 'stepWhy' | 'perStep'> {
    const binding = declaration.bindings[0];
    const offered =
      binding?.type === 'param' &&
      meta.kind === 'number' &&
      (declaration.kind === 'slider' || declaration.kind === 'knob') &&
      // (a synced speed holds a multiplier, not a speed: it is one or the other)
      this.#syncOf(runtime, declaration) === null;
    const names = offered ? this.#sequenceNames(runtime) : [];
    const per = this.#perStepOf(runtime, declaration);
    if (
      names.length === 0 &&
      !per &&
      meta.kind === 'number' &&
      binding?.type === 'param' &&
      (declaration.kind === 'slider' || declaration.kind === 'knob') &&
      this.#sequenceNames(runtime).length > 0
    ) {
      // (offered but for the sync: said, so that the menu has the entry)
      return {
        stepChoices: [],
        stepChoice: SINGLE,
        stepWhy: 'Not with sequence sync: choose another unit first',
      };
    }
    if (names.length === 0 && !per)
      return { stepChoices: [], stepChoice: SINGLE };
    const stepChoices: ModeChoice[] = [
      { id: SINGLE, label: 'Single value' },
      ...names.map((name) => ({
        id: stepChoice(name),
        label: names.length === 1 ? 'Per step' : `Per step: ${name}`,
      })),
    ];
    if (per && !names.includes(per.sequence)) {
      stepChoices.push({
        id: stepChoice(per.sequence),
        label: `Per step: ${per.sequence} (missing)`,
      });
    }
    return {
      stepChoices,
      stepChoice: per ? stepChoice(per.sequence) : SINGLE,
      ...(per
        ? { perStep: { sequence: per.sequence, missing: !per.found } }
        : {}),
    };
  }

  /** The per-step controls of a sequence, as lanes, in the order the script declares them. */
  lanes(scopeId: string, sequence: string): LaneView[] {
    const runtime = this.#scopes.get(scopeId);
    if (!runtime) return [];
    const views = this.#controlViews(scopeId, true);
    const lanes: LaneView[] = [];
    for (const declaration of runtime.declarations) {
      const per = this.#perStepOf(runtime, declaration);
      if (!per?.found || per.sequence !== sequence) continue;
      const control = views.find((view) => view.key === declaration.key);
      if (!control) continue;
      lanes.push({
        key: declaration.key,
        label: control.label,
        control,
        values: this.#stepValues(runtime, declaration, sequence),
      });
    }
    return lanes;
  }

  /**
   * What choosing "Single value" or "Per step: name" from a control's menu comes to, for one step to
   * undo. Going per step the first time, every step takes the control's single value, so nothing
   * jumps; values it had per step before are kept and come back.
   */
  stepChoiceOperations(
    scopeId: string,
    key: string,
    choice: string,
  ): Operation[] {
    const runtime = this.#scopes.get(scopeId);
    const declaration = runtime?.declarations.find((d) => d.key === key);
    if (!runtime || !declaration) return [];
    if (choice === SINGLE) {
      return [
        {
          type: 'setControlOptions',
          scope: scopeId,
          key,
          // (false where the script says per step: the person's "single" has to outrank it)
          options: {
            perStep:
              declaration.options.perStep === undefined ? undefined : false,
          },
        },
      ];
    }
    const sequence = choice.slice(PER_STEP.length + 1);
    const kept = valuesOf(this.#host.getDoc(), scopeId)?.controls[key]?.options
      ?.stepValues;
    const length = runtime.scope.transport.get(sequence)?.steps.length ?? 0;
    const single = this.#singleValue(runtime, declaration);
    return [
      {
        type: 'setControlOptions',
        scope: scopeId,
        key,
        options: {
          perStep: sequence,
          ...(kept === undefined
            ? { stepValues: new Array<number>(length).fill(single) }
            : {}),
        },
      },
    ];
  }

  /** A lane's values with one step set (the document's operation for a bar moved or typed). */
  laneOperation(
    scopeId: string,
    key: string,
    index: number,
    value: number,
  ): Operation | null {
    const runtime = this.#scopes.get(scopeId);
    const declaration = runtime?.declarations.find((d) => d.key === key);
    const per =
      runtime && declaration ? this.#perStepOf(runtime, declaration) : null;
    if (!runtime || !declaration || !per?.found) return null;
    const values = this.#stepValues(runtime, declaration, per.sequence);
    if (index < 0 || index >= values.length || values[index] === value) {
      return null;
    }
    values[index] = value;
    return {
      type: 'setControlOptions',
      scope: scopeId,
      key,
      options: { stepValues: values },
    };
  }

  /**
   * The step listeners in place: one for each sequence that has per-step controls, by scope and name.
   * They are attached outside any build (a rebuild does not add another), follow the sequence the
   * name now belongs to, and are taken off when no control needs them.
   */
  readonly #stepListeners = new Map<
    string,
    { sequence: Sequence; off: () => void }
  >();

  /** How many step listeners are attached. For tests. */
  get stepListenerCount(): number {
    return this.#stepListeners.size;
  }

  /** Brings the step listeners in line with what the scripts and the project now ask for. */
  #reconcileStepListeners(): void {
    const wanted = new Map<string, { runtime: ScopeRuntime; name: string }>();
    for (const runtime of this.#scopes.values()) {
      for (const declaration of runtime.declarations) {
        const per = this.#perStepOf(runtime, declaration);
        if (per?.found) {
          wanted.set(`${runtime.id}/${per.sequence}`, {
            runtime,
            name: per.sequence,
          });
        }
      }
    }
    for (const [key, held] of this.#stepListeners) {
      const want = wanted.get(key);
      if (
        !want ||
        want.runtime.scope.transport.get(want.name) !== held.sequence
      ) {
        held.off();
        this.#stepListeners.delete(key);
      }
    }
    for (const [key, { runtime, name }] of wanted) {
      if (this.#stepListeners.has(key)) continue;
      const sequence = runtime.scope.transport.get(name);
      if (!sequence) continue;
      const off = sequence.on('step', (event) =>
        this.#onStep(runtime.id, name, event),
      );
      this.#stepListeners.set(key, { sequence, off });
    }
    for (const runtime of this.#scopes.values()) this.#holdStepValues(runtime);
  }

  /** The step of each sequence last set by its listener, by scope and name: what the parameters hold while stopped. */
  readonly #lastStep = new Map<string, number>();

  /**
   * A step of a sequence that has per-step controls is about to sound: each of them is set to its
   * value for that step, at the step's time, before the sequence's own callback runs (so a sampler it
   * triggers on this step plays with it). Rests too. Parameter sets and nothing else: no document
   * write, nothing drawn, nothing the UI is waiting on.
   */
  #onStep(scopeId: string, name: string, event: SequenceEvent): void {
    const runtime = this.#scopes.get(scopeId);
    if (!runtime) return;
    this.#lastStep.set(`${scopeId}/${name}`, event.index);
    this.#setStepValues(runtime, name, event.index, event.time);
  }

  #setStepValues(
    runtime: ScopeRuntime,
    name: string,
    index: number,
    at: number | undefined,
  ): void {
    const values = valuesOf(this.#host.getDoc(), runtime.id);
    this.#applying = true;
    try {
      for (const declaration of runtime.declarations) {
        const binding = declaration.bindings[0];
        if (binding?.type !== 'param') continue;
        const per = this.#perStepOf(runtime, declaration);
        if (!per?.found || per.sequence !== name) continue;
        const kept = values?.controls[declaration.key]?.options?.stepValues;
        const wanted =
          typeof kept?.[index] === 'number'
            ? kept[index]
            : this.#singleValue(runtime, declaration);
        const first = this.#reach(runtime, declaration)[0];
        const range = first
          ? this.#metaOf(first.param(binding.param), declaration.options)
          : undefined;
        // (held to the range the control has now: a lane's values may be from a wider one)
        const value =
          range?.kind === 'number'
            ? Math.min(range.max, Math.max(range.min, wanted))
            : wanted;
        // (a glide the control has is portamento between steps; with none the step's value lands on the step)
        const stored = values?.controls[declaration.key]?.options?.glide;
        const glide =
          typeof stored === 'number'
            ? stored
            : (declaration.options.glide ?? 0);
        const how = {
          ...(at === undefined ? {} : { at }),
          ...(glide > 0 ? { glide } : {}),
        };
        for (const node of this.#reach(runtime, declaration)) {
          node.param(binding.param).set(value, how);
        }
      }
    } finally {
      this.#applying = false;
    }
  }

  /** While the transport is stopped a per-step control's parameter holds the step last played, or the first. */
  #holdStepValues(runtime: ScopeRuntime): void {
    if (this.engine.transport.state === 'started') return;
    const names = new Set<string>();
    for (const declaration of runtime.declarations) {
      const per = this.#perStepOf(runtime, declaration);
      if (per?.found) names.add(per.sequence);
    }
    for (const name of names) {
      const steps = runtime.scope.transport.get(name)?.steps.length ?? 0;
      const last = this.#lastStep.get(`${runtime.id}/${name}`) ?? 0;
      this.#setStepValues(runtime, name, last < steps ? last : 0, undefined);
    }
  }

  // --- A speed synced to a sequence ----------------------------------------------------------------

  /** The named sequences of a scope's script, in the order it makes them. */
  #sequenceNames(runtime: ScopeRuntime): string[] {
    return runtime.scope.transport.sequences
      .map((sequence) => sequence.name)
      .filter((name): name is string => name !== null);
  }

  /**
   * How long one pass of a sequence lasts at the tempo now, by the library's own reckoning of the
   * options the sequence has: its span, or its number of steps times its step length.
   */
  #sequenceSeconds(runtime: ScopeRuntime, name: string): number | null {
    const transport = runtime.scope.transport;
    const sequence = transport.get(name);
    if (!sequence || sequence.steps.length === 0) return null;
    try {
      const options = sequence.options;
      const seconds =
        options.span !== undefined
          ? transport.seconds(options.span)
          : transport.seconds(options.step ?? transport.stepLength) *
            sequence.steps.length;
      return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
    } catch {
      return null;
    }
  }

  /** Whether a declaration is a control over a playback speed (the one kind that can be synced). */
  #isSpeed(runtime: ScopeRuntime, declaration: Declaration): boolean {
    const binding = declaration.bindings[0];
    if (binding?.type !== 'param') return false;
    const node = this.#select(runtime, binding.selector)[0];
    if (!node || !(binding.param in node.params)) return false;
    const meta = this.#metaOf(node.param(binding.param), declaration.options);
    return (
      meta.kind === 'number' &&
      familyOf({ ...meta, name: binding.param }) === 'speed'
    );
  }

  /**
   * How a control stands if it is a speed synced to a sequence (by the person's choice of unit, else
   * by the script's `mode: 'sequence-sync'`); null for any other control.
   */
  #syncOf(runtime: ScopeRuntime, declaration: Declaration): Sync | null {
    const state = valuesOf(this.#host.getDoc(), runtime.id)?.controls[
      declaration.key
    ];
    const chosen = state?.options?.mode;
    if ((chosen ?? declaration.options.mode) !== SYNC) return null;
    if (this.#perStepOf(runtime, declaration)) return null; // (a value for every step outranks it)
    if (!this.#isSpeed(runtime, declaration)) return null;
    const binding = declaration.bindings[0];
    if (binding?.type !== 'param') return null;
    // (the sequence named with the person's choice; else the script's option; else its first)
    const sequence =
      (chosen === SYNC ? state?.options?.sequence : undefined) ??
      declaration.options.sequence ??
      this.#sequenceNames(runtime)[0] ??
      null;
    if (sequence === null) {
      return {
        sequence,
        factor: null,
        why: 'Nothing to sync to: this script has no named sequence. Playing at normal speed.',
      };
    }
    const seconds = this.#sequenceSeconds(runtime, sequence);
    if (seconds === null) {
      return {
        sequence,
        factor: null,
        why: `Nothing to sync to: this script has no sequence named '${sequence}'. Playing at normal speed.`,
      };
    }
    const node = this.#select(runtime, binding.selector)[0];
    const length = node?.buffer?.buffer?.duration;
    if (!length || !Number.isFinite(length)) {
      return {
        sequence,
        factor: null,
        why: 'Nothing to sync yet: the sound has not loaded. Playing at normal speed.',
      };
    }
    return { sequence, factor: length / seconds };
  }

  /** The speed a multiplier is now, held inside the parameter's own range. */
  #syncedSpeed(
    runtime: ScopeRuntime,
    declaration: Declaration,
    sync: Sync,
    multiplier: number,
  ): number {
    if (sync.factor === null) return 1;
    const binding = declaration.bindings[0];
    const node =
      binding?.type === 'param'
        ? this.#select(runtime, binding.selector)[0]
        : undefined;
    const meta =
      binding?.type === 'param' && node
        ? this.#metaOf(node.param(binding.param), declaration.options)
        : undefined;
    const speed = sync.factor * multiplier;
    return meta?.kind === 'number'
      ? Math.min(meta.max, Math.max(meta.min, speed))
      : speed;
  }

  /**
   * Puts every synced speed of a scope where it belongs now: after a build, a change of tempo, a
   * sound arriving or being changed, a change of unit. It is the control's own doing, as a move of
   * the control is: nothing is stored, nothing is undone, and the control is not "out of step".
   */
  #resync(runtime: ScopeRuntime): void {
    const values = valuesOf(this.#host.getDoc(), runtime.id);
    for (const declaration of runtime.declarations) {
      const binding = declaration.bindings[0];
      if (binding?.type !== 'param') continue;
      const sync = this.#syncOf(runtime, declaration);
      if (!sync) continue;
      const stored = values?.controls[declaration.key]?.value;
      const speed = this.#syncedSpeed(
        runtime,
        declaration,
        sync,
        typeof stored === 'number' ? stored : 1,
      );
      this.#applying = true;
      try {
        for (const node of this.#reach(runtime, declaration)) {
          if (node.param(binding.param).value !== speed) {
            node.param(binding.param).set(speed);
          }
          runtime.heard.set(heardKey(node, binding.param), speed);
        }
      } finally {
        this.#applying = false;
      }
    }
  }

  /**
   * What choosing a unit from a control's menu comes to, as operations for one step to undo. Most
   * units are another way of showing the same number: the choice alone. A speed going into or out of
   * "sequence sync" changes what its number means, so the number goes with it: into sync, the
   * multiplier nearest the speed it has now; out of it, the speed the multiplier was giving.
   */
  modeOperations(scopeId: string, key: string, choice: string): Operation[] {
    const runtime = this.#scopes.get(scopeId);
    const declaration = runtime?.declarations.find((d) => d.key === key);
    const binding = declaration?.bindings[0];
    const toSync = choice === SYNC || choice.startsWith(`${SYNC}:`);
    const options = toSync
      ? {
          mode: SYNC,
          sequence: choice === SYNC ? undefined : choice.slice(SYNC.length + 1),
        }
      : { mode: choice, sequence: undefined };
    const operations: Operation[] = [
      { type: 'setControlOptions', scope: scopeId, key, options },
    ];
    if (!runtime || !declaration || binding?.type !== 'param')
      return operations;
    const before = this.#syncOf(runtime, declaration);
    if (!before && !toSync) return operations;
    const node = this.#select(runtime, binding.selector)[0];
    const speed = node?.param(binding.param).value;
    if (typeof speed !== 'number') return operations;
    if (!toSync) {
      // out of sync: the speed it was playing at is the value from here on
      operations.push({
        type: 'setControlValue',
        scope: scopeId,
        key,
        value: speed,
      });
      return operations;
    }
    const name = options.sequence ?? this.#sequenceNames(runtime)[0];
    const seconds =
      name === undefined ? null : this.#sequenceSeconds(runtime, name);
    const length = node?.buffer?.buffer?.duration;
    const factor = seconds && length ? length / seconds : null;
    operations.push({
      type: 'setControlValue',
      scope: scopeId,
      key,
      value: factor === null ? 1 : nearestSync(speed / factor),
    });
    return operations;
  }

  /**
   * A script moved a control with `.set()`. The parameter is already set; what is left is the control
   * on screen and the document, which follow when the change is heard: inside a sequence callback that
   * is the step's time, not now (callbacks run ahead of the sound).
   */
  #movedByScript(
    runtime: ScopeRuntime,
    key: string,
    value: StoredValue,
    glide: number,
  ): void {
    // With a glide the library reports the change for when the glide ends. The control is moved when
    // the set lands (on its step), as it is when a person moves it: only the sound takes the glide.
    const ends = this.#lastChangeAt;
    const at = ends === null ? null : ends - glide;
    this.#lastChangeAt = null;
    this.#whenHeard(at, () => {
      // (the parameter is on its way to where the control now is: that is not "out of step")
      const declaration = runtime.declarations.find((d) => d.key === key);
      const binding = declaration?.bindings[0];
      if (declaration && binding?.type === 'param') {
        for (const node of this.#reach(runtime, declaration)) {
          runtime.heard.set(
            heardKey(node, binding.param),
            node.param(binding.param).value,
          );
        }
      } else if (binding?.type === 'bus') {
        const bus = this.#busOf(runtime, binding.name);
        if (bus) runtime.heard.set(busHeardKey(binding.name), bus.gain.value);
      }
      this.#host.dispatch({
        type: 'setControlValue',
        scope: runtime.id,
        key,
        value,
      });
    });
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
    // The script's min and max set the control's range, wider than the parameter's own or narrower (the
    // script has been checked: finite, min below max). A range that is not one falls back to the parameter's.
    const wanted = {
      min: options.min ?? meta.min,
      max: options.max ?? meta.max,
    };
    const valid = wanted.min < wanted.max;
    const min = valid ? wanted.min : meta.min;
    return {
      kind: 'number',
      min,
      max: valid ? wanted.max : meta.max,
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
  #applyStrip(track: TrackDocument, moved = false): void {
    const runtime = this.#scopes.get(track.id);
    if (!runtime) return;
    // A fader being moved sends a value on every movement: each is glided to, from wherever the level
    // has got to, so the sound has no steps in it. As a track is made there is nothing to glide from.
    const how = moved ? FOLLOW : undefined;
    const out = runtime.host.bus(OUT_BUS);
    out.gain.set(track.level, how);
    [...out.inserts]
      .find((node) => node.id === HOST_PAN_ID)
      ?.param('pan')
      .set(track.pan, how);
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
    if (origin.kind === 'listener') {
      // One of Euclip's own step listeners threw (the per-step values): the app's fault, not the
      // script's. Its sequence is not muted and the script is not blamed.
      console.error(
        'Euclip: a fault in the app while following a sequence’s steps.',
        error.cause ?? error,
      );
      return;
    }
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
        if (event.value) this.#host.stepTriggered?.(runtime.id);
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
      stepLast: new Map(),
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
    for (const name of [...this.#loadedSamples.keys()]) {
      if (!(name in doc.samples)) {
        // no longer a sound of the project: its audio stays decoded (another name, or a preview, may
        // want it), its name is free again
        this.#loadedSamples.delete(name);
        this.#missing.delete(name);
        this.engine.buffers.delete(name);
      }
    }
    for (const [name, source] of Object.entries(doc.samples)) {
      const from = sourceId(source);
      if (this.#loadedSamples.get(name) !== from) {
        this.#loadedSamples.set(name, from);
        this.#missing.delete(name);
        const decoded = this.#decoded.get(from);
        if (decoded) {
          // heard already, or in the project under another name: decoded once, shared
          this.engine.buffers.add(name, decoded);
        } else if (source.file !== undefined) {
          // not awaited: a sampler without its sound yet is silent, and plays once it arrives
          const reading = this.#loadFile(name, source.file).finally(() =>
            this.#reading.delete(reading),
          );
          this.#reading.add(reading);
        } else {
          const url =
            source.library !== undefined
              ? this.#host.libraryUrl?.(source.library)
              : source.url;
          if (url !== undefined) this.engine.buffers.load(url, { key: name });
        }
      }
      this.#applySlices(name);
    }
  }

  /** Audio already decoded, by where it comes from (pool.ts `sourceId`): a source is decoded once. */
  readonly #decoded = new Map<string, AudioBuffer>();

  /** The decoded audio of a source, if it has been decoded: for hearing it without loading it again. */
  decoded(source: string): AudioBuffer | undefined {
    return this.#decoded.get(source);
  }

  /** Keeps audio decoded elsewhere (a preview): a project sound on the same source will use it. */
  keepDecoded(source: string, buffer: AudioBuffer): void {
    this.#decoded.delete(source);
    this.#decoded.set(source, buffer);
    // Heard sounds are kept so that using one does not decode it again, but not without end: beyond
    // a few dozen the oldest that no project sound is on are let go.
    if (this.#decoded.size > DECODED_KEPT) {
      const inUse = new Set(this.#loadedSamples.values());
      for (const key of this.#decoded.keys()) {
        if (this.#decoded.size <= DECODED_KEPT) break;
        if (!inUse.has(key) && key !== source) this.#decoded.delete(key);
      }
    }
  }

  /**
   * Tries again to give a project sound its audio: one that failed to load, or one whose file has been
   * supplied again. The new audio goes into the entry the name already has, so the samplers that play
   * it have it at once (a sampler keeps the entry it found; it does not look a name up again).
   */
  async retrySample(name: string): Promise<void> {
    const source = this.#host.getDoc().samples[name];
    if (!source) return;
    const from = sourceId(source);
    let decoded = this.#decoded.get(from);
    if (!decoded) {
      let bytes: ArrayBuffer | null = null;
      try {
        if (source.file !== undefined) {
          bytes = (await this.#host.readFile?.(source.file)) ?? null;
        } else {
          const url =
            source.library !== undefined
              ? this.#host.libraryUrl?.(source.library)
              : source.url;
          const response = url === undefined ? null : await fetch(url);
          bytes = response?.ok ? await response.arrayBuffer() : null;
        }
        if (bytes) decoded = await this.engine.context.decodeAudioData(bytes);
      } catch {
        // (as it was: still failed)
      }
    }
    if (!decoded) {
      this.#host.changed();
      return;
    }
    this.#decoded.set(from, decoded);
    this.#loadedSamples.set(name, from);
    this.#missing.delete(name);
    const ref = this.engine.buffers.add(name, decoded);
    // A sampler keeps the entry it found under a name, and the name now has another. Being given the
    // same name again is no change to the library, so the samplers that play it are given it by way
    // of another sound, in the same instant.
    const other = this.engine.buffers
      .list()
      .find((entry) => entry.key !== name && entry.state === 'ready');
    for (const runtime of this.#scopes.values()) {
      for (const node of this.#ownNodes(runtime)) {
        if (node.buffer && node.buffer !== ref && node.buffer.key === name) {
          if (other) node.setOption(BUFFER_OPTION, other.key);
          node.setOption(BUFFER_OPTION, name);
        }
      }
    }
    this.#applySlices(name);
    // (a speed synced to a sequence needs the sound's length)
    for (const runtime of this.#scopes.values()) this.#resync(runtime);
    this.#host.changed();
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
    const decoded = this.#decoded.get(`file:${file}`);
    if (decoded) {
      this.engine.buffers.add(name, decoded);
      return;
    }
    if (!bytes) {
      console.warn(
        `Euclip: the audio of "${name}" is not in this browser's storage.`,
      );
      this.#missing.add(name);
      // The name still gets an entry (a moment of silence): a sampler given a name with no entry
      // would go looking for a file of that name, and would not look again when the audio comes.
      if (!this.engine.buffers.get(name)) {
        this.engine.buffers.add(
          name,
          this.engine.context.createBuffer(
            1,
            1,
            this.engine.context.sampleRate,
          ),
        );
      }
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
  /** The project sounds whose file is not on this browser's shelf (as against one that failed to load or decode). */
  missingFiles(): string[] {
    return [...this.#missing];
  }

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

  // --- Hearing a sound that is not in the project ---------------------------------------------------

  #hearing: Node | null = null;

  /**
   * Plays decoded audio for the ear, through the app's main output, without the transport and without
   * touching the project: a sampler of Euclip's own, in a scope of its own. One sound at a time.
   *
   * Each sound is given to the sampler under a key of its own. (A sampler keeps the entry it found
   * under a key: putting new audio under one fixed key left it playing the first sound for ever.) The
   * key before it is dropped, so nothing piles up in the buffer store.
   */
  async hear(buffer: AudioBuffer): Promise<void> {
    const key = `${HEAR_KEY}:${++this.#hears}`;
    this.engine.buffers.add(key, buffer);
    if (!this.#hearing) {
      const scope = this.engine.scope(HEAR_SCOPE);
      await scope.build((api) => {
        api().sampler({ id: 'hear', buffer: key }).to('main');
      });
      this.#hearing = [...scope.select('#hear')][0] ?? null;
    }
    const node = this.#hearing;
    if (!node) return;
    this.stopHearing();
    node.setOption(BUFFER_OPTION, key);
    const before = this.#hearKey;
    this.#hearKey = key;
    if (before !== null && before !== key) this.engine.buffers.delete(before);
    node.trigger({});
  }
  #hears = 0;
  #hearKey: string | null = null;

  /** The audio the hearing sampler has now: what the last `hear` plays. For tests and drivers. */
  get heard(): AudioBuffer | null {
    return this.#hearing?.buffer?.buffer ?? null;
  }

  stopHearing(): void {
    try {
      this.#hearing?.release();
    } catch {
      // (nothing sounding)
    }
  }

  /**
   * Silences everything, for the Stop button's second press. cracked-up has no all-notes-off and no way
   * to empty a delay or reverb, so: the main output is faded to nothing over a few milliseconds (no
   * click), every voice is released, every script's scope is emptied (which disposes its delays and
   * reverbs, and their tails with them) and run again, which makes them anew, and the output comes
   * back. The document and every stored control value are left alone (the scripts read them as they
   * ran before). The output is restored even if something throws.
   */
  async silence(): Promise<void> {
    const main = this.engine.root.bus('main');
    const level = main.gain.value;
    main.gain.set(0, { glide: SILENCE_FADE });
    try {
      if (!this.engine.offline) {
        await new Promise((resolve) =>
          setTimeout(resolve, SILENCE_FADE * 1000 * 1.5),
        );
      }
      this.stopHearing();
      const releaseAll = (): void => {
        try {
          this.engine.root.select('*').release();
        } catch {
          // (nothing to release)
        }
      };
      releaseAll();
      for (const [id, runtime] of [...this.#scopes]) {
        try {
          await runtime.scope.build(() => undefined);
          await this.run(id, true);
        } catch (error) {
          console.warn('Euclip: a scope could not be rebuilt.', error);
        }
      }
      releaseAll();
    } finally {
      main.gain.set(level, { glide: SILENCE_FADE });
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
