/**
 * The shapes the runner hands the UI (controls, lanes, step grids, sources) and the ones its parts share
 * (a scope's runtime record, the host's interface), with the few constants they are measured by.
 * Types and constants only: nothing here runs.
 */

import type { Scope } from 'cracked-up';
import {
  CHANNEL_BUS,
  type Declaration,
  type DeclarationWarning,
} from 'client-v2/controls/declarations';
import { type ModeName, type NumberMeta } from 'client-v2/controls/modes';
import { type Operation } from 'client-v2/project/operations';
import {
  type ProjectDocument,
  type StoredValue,
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
   * Its lane: a value it can hold on any step of a sequence (an Elektron-style lock), over the single
   * value that every other step follows. Every slider and knob on a number parameter and every toggle
   * on a parameter has one where the script has a sequence with a step grid; absent for the rest.
   */
  lane?: LaneInfo;
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

/** Where a control's lane is and what it holds (see `ControlView.lane`). */
export interface LaneInfo {
  /** the sequence it follows: the person's choice, else the script's `perStep`, else the first with a grid */
  sequence: string;
  /** the sequence is not in the script now: every step is at the single value meanwhile */
  missing: boolean;
  /** the sequences with a step grid it could follow, in the script's order */
  sequences: string[];
  /** how many steps of the sequence hold a value of their own */
  locked: number;
  /** how many steps the sequence has */
  steps: number;
}

/**
 * A control's lane under its sequence's grid: a bar (a toggle's: a cell) for every step, each the
 * value the control has on that step: the step's own where it has one, else the single value.
 */
export interface LaneView {
  /** the control's key */
  key: string;
  label: string;
  /** the control as its row would show it: its unit, range and mode are the lane's */
  control: ControlView;
  /** a toggle's lane is on and off; a slider's or knob's is numbers */
  kind: 'number' | 'toggle';
  /** the value on each step, in the parameter's own terms (a toggle's: 1 on, 0 off) */
  values: number[];
  /** which steps hold a value of their own (the others follow the single value) */
  locked: boolean[];
  /** some step holds a value of its own: the lane is in play */
  active: boolean;
}

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
export const FOLLOW = { glide: FOLLOW_SECONDS };
export const SYNC = 'sequence-sync';
export const syncChoice = (sequence: string): string => `${SYNC}:${sequence}`;

/** A speed synced to a sequence, as things stand: which sequence, and what a multiplier of 1 is as a speed. */
export interface Sync {
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
  /** notes are given to it as the pitch of its trigger (a synth macro with no pitch parameter): the keyboard plays, and stores nothing */
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

export interface ScopeRuntime {
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
  playheads: Map<string, number>;
  off: (() => void)[];
}
/** Where the script's nodes and buses are in the order of things: see ProjectRunner#layout. */
export interface Layout {
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
export const SAME_PLACE = 0.002;

export interface RunnerOptions {
  /**
   * The engine plays in real time: a change is shown when it is heard, and the "now at" marker waits
   * EFFECTIVE_DELAY_MS before it shows. Default: whether the engine's context is a live one. Offline
   * (tests, rendering) everything is immediate.
   */
  realtime?: boolean;
}
