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
  Duration,
  Engine,
  GraphError,
  Node,
  NodeTypeInfo,
  ParamChange,
  SequenceEvent,
} from 'cracked-up';
import {
  compile,
  currentScriptLine,
  type Program,
} from 'client-v2/audio/compile';
import { buildModel, readScope } from 'cracked-up/inspect';
import { buildChainGraph, type ChainGraph } from 'client-v2/audio/chain-view';
import {
  CHANNEL_BUS,
  type Declaration,
  type DeclarationWarning,
} from 'client-v2/controls/declarations';
import {
  createControlApi,
  fitSteps,
  gridLength,
  type ControlHost,
} from 'client-v2/controls/script-api';
import { type Operation } from 'client-v2/project/operations';
import {
  PROJECT_SCOPE,
  stepGridKey,
  type StoredValue,
} from 'client-v2/project/schema';
import type {
  RunnerContext,
  RunnerParts,
} from 'client-v2/audio/runner/context';
import { ControlViews } from 'client-v2/audio/runner/controls';
import { Editors } from 'client-v2/audio/runner/editors';
import { Lanes } from 'client-v2/audio/runner/lanes';
import { SequenceSync } from 'client-v2/audio/runner/sync';
import { ChannelStrip } from 'client-v2/audio/runner/strip';
import { SoundLibrary } from 'client-v2/audio/runner/sounds';
export {
  EFFECTIVE_DELAY_MS,
  FOLLOW_SECONDS,
  HOST_PAN_ID,
  OUT_BUS,
  OWN_GROUP,
} from 'client-v2/audio/runner/types';
export type {
  ControlGroup,
  ControlMeta,
  ControlView,
  GlideView,
  LaneInfo,
  LaneView,
  LiveCatalog,
  ModeChoice,
  RunnerHost,
  RunnerOptions,
  ScriptError,
  SourceView,
  StepGridView,
  SynthView,
  WaveformView,
} from 'client-v2/audio/runner/types';
import {
  FOLLOW,
  OUT_BUS,
  type ControlView,
  type LaneView,
  type LiveCatalog,
  type SourceView,
  type StepGridView,
  type SynthView,
  type WaveformView,
  type RunnerHost,
  type RunnerOptions,
  type ScopeRuntime,
  type ScriptError,
} from 'client-v2/audio/runner/types';
import {
  describeError,
  valuesOf,
  scriptOf,
  heardKey,
  busHeardKey,
  rankOf,
  select,
  reach,
  typeInfo,
  busOf,
} from 'client-v2/audio/runner/access';

/** Seconds to fade the output over before everything is silenced: short, but enough to avoid a click. */
const SILENCE_FADE = 0.03;

export class ProjectRunner {
  readonly engine: Engine;
  readonly #host: RunnerHost;
  readonly #scopes = new Map<string, ScopeRuntime>();
  readonly #off: (() => void)[] = [];
  readonly #timers = new Set<ReturnType<typeof setTimeout>>();
  /** the audio time of the parameter change most recently made, for `control.set()` in a callback */
  #lastChangeAt: number | null = null;
  readonly #realtime: boolean;
  readonly #ctx: RunnerContext;
  readonly #parts: RunnerParts;

  constructor(engine: Engine, host: RunnerHost, options: RunnerOptions = {}) {
    this.engine = engine;
    this.#host = host;
    this.#realtime = options.realtime ?? !engine.offline;
    const parts = {} as RunnerParts;
    this.#parts = parts;
    this.#ctx = {
      engine,
      host,
      scopes: this.#scopes,
      realtime: this.#realtime,
      timers: this.#timers,
      applying: false,
      parts,
    };
    Object.assign(parts, {
      views: new ControlViews(this.#ctx),
      editors: new Editors(this.#ctx),
      lanes: new Lanes(this.#ctx),
      sync: new SequenceSync(this.#ctx),
      strip: new ChannelStrip(this.#ctx),
      sounds: new SoundLibrary(this.#ctx),
    });
    // Playheads move when a step is heard, not when its callback runs (which is ahead of the sound).
    this.#off.push(
      engine.transport.onDisplay((event) => this.#display(event)),
      engine.transport.on('stop', () => this.#clearPlayheads()),
      // a control's range can depend on a sample (a sampler's start and end): say when one arrives
      engine.buffers.on('ready', (ref) => this.#parts.sounds.onReady(ref)),
      engine.buffers.on('slices', (ref) => this.#parts.sounds.onSlices(ref)),
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
    this.#parts.sounds.loadSamples(doc);
    await this.#parts.sounds.filesRead();
    await this.run(PROJECT_SCOPE);
    for (const track of doc.tracks) await this.run(track.id);
  }

  dispose(): void {
    this.#parts.lanes.dispose();
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
      typeInfo: (type) => typeInfo(this.engine, type),
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
        const lane =
          declaration && this.#parts.lanes.activeLane(runtime, declaration);
        if (!declaration || !lane) return null;
        const steps =
          runtime.scope.transport.get(lane.sequence)?.steps.length ?? 0;
        const last =
          this.#parts.lanes.lastStep.get(`${runtime.id}/${lane.sequence}`) ?? 0;
        return {
          value: this.#parts.lanes.stepValue(
            runtime,
            declaration,
            lane.sequence,
            last < steps ? last : 0,
          ),
        };
      },
      glide: (key) =>
        this.#parts.views
          .controlViews(runtime.id, true)
          .find((view) => view.key === key)?.glide?.seconds ?? 0,
      sync: (key) => {
        const find = (): Declaration | undefined =>
          declared.get(key) ??
          runtime.declarations.find((candidate) => candidate.key === key);
        const first = find();
        if (!first || !this.#parts.sync.syncOf(runtime, first)) return null;
        // (asked again at every use: a callback's set() next week is at that day's tempo)
        return (multiplier) => {
          const declaration = find();
          const sync =
            declaration && this.#parts.sync.syncOf(runtime, declaration);
          return declaration && sync
            ? this.#parts.sync.syncedSpeed(
                runtime,
                declaration,
                sync,
                multiplier,
              )
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
      this.#parts.sync.resync(runtime);
      this.#parts.lanes.reconcileStepListeners();
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
    this.#parts.sounds.loadSamples(doc);
    await this.#parts.sounds.filesRead();
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
    for (const track of doc.tracks) this.#parts.strip.applyStrip(track, true);
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
        for (const runtime of this.#scopes.values())
          this.#parts.sync.resync(runtime);
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
        if (track) this.#parts.strip.applyStrip(track, true);
        break;
      }
      case 'setTrackMute':
      case 'setTrackSolo':
        // (one track's solo changes what every other track is)
        for (const track of doc.tracks)
          this.#parts.strip.applyStrip(track, true);
        break;
      case 'addTrack':
        void this.run(op.track.id);
        // (a track that is not soloed, added while one is, is silent; the others are unchanged)
        break;
      case 'removeTrack':
        this.#remove(op.id);
        // (the last soloed track going lets the rest be heard)
        for (const track of doc.tracks)
          this.#parts.strip.applyStrip(track, true);
        break;
      case 'renameSample':
      case 'duplicateSample':
        // (names scripts and samplers know sounds by have changed: every script runs again)
        this.engine.buffers.delete(op.type === 'renameSample' ? op.from : '');
        this.#parts.sounds.loadedSamples.delete(
          op.type === 'renameSample' ? op.from : '',
        );
        void this.sync();
        break;
      case 'setSample':
      case 'addSample':
      case 'removeSample':
        this.#parts.sounds.loadSamples(doc);
        break;
      case 'setSampleSlices':
        if (!fromScript) this.#parts.sounds.applySlices(op.name);
        break;
      case 'setControlOptions': {
        // (a unit that is "synced to a sequence" changes what the stored number means)
        const runtime = this.#scopes.get(op.scope);
        if (runtime) {
          // (a grid's length or step length: the sequence takes it, and what follows a sequence follows)
          this.#applyGridShape(runtime, op.key);
          this.#parts.sync.resync(runtime);
        }
        // (a lane may have come into play, or gone out of it, or had a bar moved)
        this.#parts.lanes.reconcileStepListeners();
        if (
          runtime &&
          ('stepValues' in op.options || 'perStep' in op.options)
        ) {
          // a lane out of play: its parameter goes back to the single value
          const declaration = runtime.declarations.find(
            (d) => d.key === op.key,
          );
          if (
            declaration &&
            this.#parts.lanes.laneOf(runtime, declaration) &&
            !this.#parts.lanes.activeLane(runtime, declaration)
          ) {
            this.#applyControl(
              op.scope,
              op.key,
              this.#parts.lanes.singleValue(runtime, declaration),
            );
          }
        }
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
    const node = runtime ? select(runtime, `#${nodeId}`)[0] : undefined;
    const value = node?.param(param).value;
    return typeof value === 'number' ? value : undefined;
  }

  /** A node of a scope's running script, by id (for tapping its output); undefined if there is none. */
  /** What leaves a track's channel strip: after its level and pan, on its way to main. */
  channelOutput(trackId: string): AudioNode | null {
    const runtime = this.#scopes.get(trackId);
    return runtime && trackId !== PROJECT_SCOPE
      ? runtime.host.bus(OUT_BUS).output
      : null;
  }

  nodeById(scopeId: string, nodeId: string): Node | undefined {
    const runtime = this.#scopes.get(scopeId);
    return runtime ? select(runtime, `#${nodeId}`)[0] : undefined;
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
    return this.#parts.views
      .controlViews(scopeId, false)
      .filter((view) => view.source === null);
  }

  /** Every declared control, sources' included: what `controls` and `sourceControls` split between the two tabs. */
  allControls(scopeId: string): ControlView[] {
    return this.#parts.views.controlViews(scopeId, false);
  }

  /** The controls of one source node, as the source tab shows them with its editor. */
  sourceControls(scopeId: string, nodeId: string): ControlView[] {
    return this.#parts.views
      .controlViews(scopeId, false)
      .filter((view) => view.source === nodeId);
  }

  /**
   * Whether a node is a source of sound, by what the library says its type is: category 'source'
   * (sampler, the oscillators, noise), or a synth macro (category 'synth': a macro that makes sound
   * from triggers and takes none in). The library does not say whether a macro of another category has
   * an audio input, so one of those is not told apart from an effect: it stays under processors.
   */
  isSource(node: Node): boolean {
    return typeInfo(this.engine, node.type)?.source === true;
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
    // a step is on or off: what it plays is set in the lanes of what it drives (a pitch, a slice)
    const steps = [...sequence.steps];
    steps[index] = (steps[index] ?? 0) !== 0 ? 0 : 1;
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
      // A lane in play whose step now (the one playing, or held while stopped) has a value of its own:
      // the step keeps it. The single value is for the steps that follow it, from the next of them on.
      const lane = this.#parts.lanes.activeLane(runtime, declaration);
      if (lane) {
        const steps =
          runtime.scope.transport.get(lane.sequence)?.steps.length ?? 0;
        const last =
          this.#parts.lanes.lastStep.get(`${scopeId}/${lane.sequence}`) ?? 0;
        const locks = this.#parts.lanes.locksOf(
          runtime,
          declaration,
          lane.sequence,
        );
        if (locks[last < steps ? last : 0] !== null) return;
      }
      const sync = this.#parts.sync.syncOf(runtime, declaration);
      if (sync && typeof value === 'number') {
        // the control holds a multiplier: the parameter gets the speed that is at this tempo
        value = this.#parts.sync.syncedSpeed(runtime, declaration, sync, value);
      }
      // The parameter goes where the control is, by the control's own doing: that is not "the script
      // moved it", now or when the change is heard.
      this.#ctx.applying = true;
      try {
        // A control on a continuous parameter is followed as a fader is (the library glides the
        // parameters that can, and sets the others). One that moves in whole steps of its unit
        // (stepped, notes, semitones, slices, a synced speed) jumps, as do a toggle's and a select's.
        const how =
          typeof value === 'number'
            ? this.#parts.views.howFor(runtime, key)
            : undefined;
        for (const node of reach(runtime, declaration)) {
          node.param(binding.param).set(value, how);
          runtime.heard.set(heardKey(node, binding.param), value);
        }
      } finally {
        this.#ctx.applying = false;
      }
    } else if (binding.type === 'option' && typeof value === 'string') {
      // the sound a sampler plays: changed in place, so what is sounding finishes on the old one
      for (const node of select(runtime, binding.selector)) {
        node.setOption(binding.option, value);
      }
      this.#parts.sync.resync(runtime); // (another sound, another length)
    } else if (binding.type === 'bus' && typeof value === 'number') {
      const bus = busOf(this.engine, runtime, binding.name);
      if (!bus) return;
      this.#ctx.applying = true;
      try {
        bus.gain.set(value, this.#parts.views.howFor(runtime, key) ?? FOLLOW);
        runtime.heard.set(busHeardKey(binding.name), value);
      } finally {
        this.#ctx.applying = false;
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
        for (const node of reach(runtime, declaration)) {
          runtime.heard.set(
            heardKey(node, binding.param),
            node.param(binding.param).value,
          );
        }
      } else if (binding?.type === 'bus') {
        const bus = busOf(this.engine, runtime, binding.name);
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
    if (this.#ctx.applying) return; // the user's own move: already where the control is (see #applyControl)
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
      const node = select(runtime, binding.selector)[0];
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
      playheads: new Map(),
      off: [],
    };
    runtime = created;
    this.#scopes.set(scopeId, created);
    if (track) {
      // The track's way out, made by the host (see ChannelStrip#make).
      this.#parts.strip.make(host, track);
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

  // --- Delegated to the parts (see audio/runner/) --------------------------------------------------

  /** The waveform editors a script declares, in the order it declared them. */
  waveforms(scopeId: string): WaveformView[] {
    return this.#parts.editors.waveforms(scopeId);
  }

  /** The synth editors a script declares, in the order it declared them. */
  synths(scopeId: string): SynthView[] {
    return this.#parts.editors.synths(scopeId);
  }

  /** Every source editor the script declares: what the source tab lists. */
  sources(scopeId: string): SourceView[] {
    return this.#parts.editors.sources(scopeId);
  }

  /** Starts a note on a source and holds it until `releaseNote` (see Editors#playNote). */
  playNote(
    scopeId: string,
    nodeId: string,
    note: { midi: number; hz: number; param: string | null },
  ): boolean {
    return this.#parts.editors.playNote(scopeId, nodeId, note);
  }

  /** Ends the note `playNote` started. */
  releaseNote(scopeId: string, nodeId: string): void {
    this.#parts.editors.releaseNote(scopeId, nodeId);
  }

  /** A node of a scope's script by id: for drawing its sound and play position, and auditioning it. */
  sampler(scopeId: string, nodeId: string): Node | undefined {
    return this.#parts.editors.sampler(scopeId, nodeId);
  }

  /** The declared step grids, in the order the script declared them. */
  stepGrids(scopeId: string): StepGridView[] {
    return this.#parts.editors.stepGrids(scopeId);
  }

  /** What the editors' catalog is to offer from the live project. */
  catalog(): LiveCatalog {
    return this.#parts.editors.catalog();
  }

  /** Plays a sampler now, for the ear. */
  audition(scopeId: string, nodeId: string, slice?: number): boolean {
    return this.#parts.editors.audition(scopeId, nodeId, slice);
  }

  /** The lanes of a sequence: every control whose lane follows it (see Lanes#lanes). */
  lanes(scopeId: string, sequence: string): LaneView[] {
    return this.#parts.lanes.lanes(scopeId, sequence);
  }

  /** One step of a control's lane given a value of its own, or back to the single value. */
  laneOperation(
    scopeId: string,
    key: string,
    index: number,
    value: number | boolean | null,
  ): Operation | null {
    return this.#parts.lanes.laneOperation(scopeId, key, index, value);
  }

  /** Every step of a lane back to following the single value (one operation). */
  laneResetOperation(scopeId: string, key: string): Operation | null {
    return this.#parts.lanes.laneResetOperation(scopeId, key);
  }

  /** The lane follows another sequence. */
  laneSequenceOperation(
    scopeId: string,
    key: string,
    sequence: string,
  ): Operation | null {
    return this.#parts.lanes.laneSequenceOperation(scopeId, key, sequence);
  }

  /** How many step listeners are attached. For tests. */
  get stepListenerCount(): number {
    return this.#parts.lanes.stepListenerCount;
  }

  /** What choosing a unit from a control's menu comes to, as operations for one step to undo. */
  modeOperations(scopeId: string, key: string, choice: string): Operation[] {
    return this.#parts.sync.modeOperations(scopeId, key, choice);
  }

  /** The decoded audio of a source, if it has been decoded. */
  decoded(source: string): AudioBuffer | undefined {
    return this.#parts.sounds.decoded(source);
  }

  /** Keeps audio decoded elsewhere (a preview): a project sound on the same source will use it. */
  keepDecoded(source: string, buffer: AudioBuffer): void {
    this.#parts.sounds.keepDecoded(source, buffer);
  }

  /** Tries again to give a project sound its audio. */
  retrySample(name: string): Promise<void> {
    return this.#parts.sounds.retrySample(name);
  }

  /** The project sounds whose file is not on this browser's shelf. */
  missingFiles(): string[] {
    return this.#parts.sounds.missingFiles();
  }

  /** Sounds of the pool whose audio could not be found or read. */
  missingSamples(): string[] {
    return this.#parts.sounds.missingSamples();
  }

  /** Plays decoded audio for the ear, without the transport and without touching the project. */
  hear(buffer: AudioBuffer): Promise<void> {
    return this.#parts.sounds.hear(buffer);
  }

  /** The audio the hearing sampler has now. For tests and drivers. */
  get heard(): AudioBuffer | null {
    return this.#parts.sounds.heard;
  }

  stopHearing(): void {
    this.#parts.sounds.stopHearing();
  }

  /** Resolves when every sound of the pool has loaded (or failed). For tests and offline rendering. */
  samplesReady(): Promise<void> {
    return this.#parts.sounds.samplesReady();
  }

  /**
   * Stops everything, for the Stop button: cracked-up's `stopAll`. The transport stops, the main
   * output fades out over a few milliseconds (no click), every voice, loop, envelope and delay or
   * reverb tail is cut, and the output comes back for what is played next. Nothing is rebuilt, and the
   * document and every control value are left alone.
   */
  silence(): void {
    this.#parts.sounds.stopHearing();
    this.engine.stopAll({ fade: SILENCE_FADE });
  }
}
