/**
 * Per-step values (the lanes under a sequence's grid): which sequence a control's lane follows, the value
 * each step holds, the operations that change them, and the step listeners that set a parameter to its
 * value for the step about to sound.
 */

import type { Sequence, SequenceEvent } from 'cracked-up';
import { type Declaration } from 'client-v2/controls/declarations';
import { type Operation } from 'client-v2/project/operations';
import {
  type ControlView,
  type LaneView,
  type ScopeRuntime,
} from 'client-v2/audio/runner/types';
import { valuesOf, select, reach, metaOf } from 'client-v2/audio/runner/access';
import type { RunnerContext } from 'client-v2/audio/runner/context';

export class Lanes {
  readonly ctx: RunnerContext;

  constructor(ctx: RunnerContext) {
    this.ctx = ctx;
  }

  /** Takes every step listener off. */
  dispose(): void {
    for (const held of this.#stepListeners.values()) held.off();
    this.#stepListeners.clear();
  }

  /**
   * The sequence a control's lane follows: the person's choice, else the script's `perStep` (`true`: the
   * first sequence with a grid), else the first sequence with a grid. Null for a control that has no
   * lane: one that is not a slider or knob on a number parameter or a toggle on a parameter, or a
   * script with no sequence to follow.
   */
  laneOf(
    runtime: ScopeRuntime,
    declaration: Declaration,
  ): { sequence: string; found: boolean; sequences: string[] } | null {
    const binding = declaration.bindings[0];
    if (binding?.type !== 'param') return null;
    if (
      declaration.kind !== 'slider' &&
      declaration.kind !== 'knob' &&
      declaration.kind !== 'toggle'
    ) {
      return null;
    }
    const sequences = this.gridSequences(runtime);
    const chosen = valuesOf(this.ctx.host.getDoc(), runtime.id)?.controls[
      declaration.key
    ]?.options?.perStep;
    const declared = declaration.options.perStep;
    const sequence =
      typeof chosen === 'string'
        ? chosen
        : typeof declared === 'string'
          ? declared
          : (sequences[0] ?? this.ctx.parts.sync.sequenceNames(runtime)[0]);
    if (sequence === undefined) return null;
    return {
      sequence,
      found: runtime.scope.transport.get(sequence) !== undefined,
      sequences,
    };
  }

  /** The named sequences a step grid is declared for, in the order the script declares the grids. */
  gridSequences(runtime: ScopeRuntime): string[] {
    const names: string[] = [];
    for (const declaration of runtime.declarations) {
      const binding = declaration.bindings[0];
      if (
        binding?.type === 'sequence' &&
        !names.includes(binding.name) &&
        runtime.scope.transport.get(binding.name)
      ) {
        names.push(binding.name);
      }
    }
    return names;
  }

  /**
   * The values a control's steps hold of their own, one for each step of its sequence as it is now:
   * null where the step follows the single value. (What is stored past the sequence's end is kept in
   * the document, for when it grows again.) A choice of "single value" from an earlier version
   * (`perStep: false`) holds none.
   */
  locksOf(
    runtime: ScopeRuntime,
    declaration: Declaration,
    sequence: string,
  ): (number | boolean | null)[] {
    const options = valuesOf(this.ctx.host.getDoc(), runtime.id)?.controls[
      declaration.key
    ]?.options;
    const length = runtime.scope.transport.get(sequence)?.steps.length ?? 0;
    const kept = options?.perStep === false ? [] : (options?.stepValues ?? []);
    const toggle = declaration.kind === 'toggle';
    return Array.from({ length }, (_, index) => {
      const value = kept[index];
      if (toggle) return typeof value === 'boolean' ? value : null;
      return typeof value === 'number' && Number.isFinite(value) ? value : null;
    });
  }

  /** The control's lane where it is in play: its sequence is there and some step holds a value of its own. */
  activeLane(
    runtime: ScopeRuntime,
    declaration: Declaration,
  ): { sequence: string } | null {
    const lane = this.laneOf(runtime, declaration);
    if (!lane?.found) return null;
    return this.locksOf(runtime, declaration, lane.sequence).some(
      (value) => value !== null,
    )
      ? { sequence: lane.sequence }
      : null;
  }

  /** What a control has on one step of its lane: the step's own value, else the single value. */
  stepValue(
    runtime: ScopeRuntime,
    declaration: Declaration,
    sequence: string,
    index: number,
  ): number | boolean {
    return (
      this.locksOf(runtime, declaration, sequence)[index] ??
      this.singleValue(runtime, declaration)
    );
  }

  /** The control's single value: what the project holds, else what the script gives the parameter. */
  singleValue(
    runtime: ScopeRuntime,
    declaration: Declaration,
  ): number | boolean {
    const toggle = declaration.kind === 'toggle';
    const stored = valuesOf(this.ctx.host.getDoc(), runtime.id)?.controls[
      declaration.key
    ]?.value;
    if (toggle ? typeof stored === 'boolean' : typeof stored === 'number') {
      return stored as number | boolean;
    }
    // (a synced speed holds a multiplier: 1 until there is another)
    if (!toggle && this.ctx.parts.sync.syncOf(runtime, declaration)) return 1;
    const fallback = runtime.defaults.get(declaration.key);
    if (toggle ? typeof fallback === 'boolean' : typeof fallback === 'number') {
      return fallback as number | boolean;
    }
    const binding = declaration.bindings[0];
    const node =
      binding?.type === 'param'
        ? select(runtime, binding.selector)[0]
        : undefined;
    const value =
      binding?.type === 'param' ? node?.param(binding.param).value : undefined;
    if (toggle) return value === true;
    return typeof value === 'number' ? value : 0;
  }

  /** What a control's row says about its lane. */
  laneInfo(
    runtime: ScopeRuntime,
    declaration: Declaration,
  ): Pick<ControlView, 'lane'> {
    const lane = this.laneOf(runtime, declaration);
    if (!lane) return {};
    const locks = lane.found
      ? this.locksOf(runtime, declaration, lane.sequence)
      : [];
    return {
      lane: {
        sequence: lane.sequence,
        missing: !lane.found,
        sequences: lane.sequences,
        locked: locks.filter((value) => value !== null).length,
        steps: locks.length,
      },
    };
  }

  /**
   * The lanes of a sequence: every control whose lane follows it, in play or not, in the order the
   * script declares them.
   */
  lanes(scopeId: string, sequence: string): LaneView[] {
    const runtime = this.ctx.scopes.get(scopeId);
    if (!runtime) return [];
    const views = this.ctx.parts.views.controlViews(scopeId, true);
    const lanes: LaneView[] = [];
    for (const declaration of runtime.declarations) {
      const lane = this.laneOf(runtime, declaration);
      if (!lane?.found || lane.sequence !== sequence) continue;
      const control = views.find((view) => view.key === declaration.key);
      if (!control) continue;
      const locks = this.locksOf(runtime, declaration, sequence);
      const single = this.singleValue(runtime, declaration);
      const number = (value: number | boolean): number =>
        typeof value === 'boolean' ? (value ? 1 : 0) : value;
      lanes.push({
        key: declaration.key,
        label: control.label,
        control,
        kind: declaration.kind === 'toggle' ? 'toggle' : 'number',
        values: locks.map((value) => number(value ?? single)),
        locked: locks.map((value) => value !== null),
        active: locks.some((value) => value !== null),
      });
    }
    return lanes;
  }

  /**
   * One step of a control's lane given a value of its own (the document's operation for a bar moved,
   * typed or a toggle's cell pressed), or, with null, back to following the single value. Null when
   * there is nothing to change.
   */
  laneOperation(
    scopeId: string,
    key: string,
    index: number,
    value: number | boolean | null,
  ): Operation | null {
    const runtime = this.ctx.scopes.get(scopeId);
    const declaration = runtime?.declarations.find((d) => d.key === key);
    const lane =
      runtime && declaration ? this.laneOf(runtime, declaration) : null;
    if (!runtime || !declaration || !lane?.found) return null;
    const length =
      runtime.scope.transport.get(lane.sequence)?.steps.length ?? 0;
    if (index < 0 || index >= length) return null;
    if (
      value !== null &&
      typeof value !== (declaration.kind === 'toggle' ? 'boolean' : 'number')
    ) {
      return null;
    }
    const state = valuesOf(this.ctx.host.getDoc(), scopeId)?.controls[key];
    const legacy = state?.options?.perStep === false;
    const kept = legacy ? [] : [...(state?.options?.stepValues ?? [])];
    const locks = this.locksOf(runtime, declaration, lane.sequence);
    if ((locks[index] ?? null) === value) return null;
    // (the steps past the sequence's end stay as they are)
    const values: (number | boolean | null)[] = Array.from(
      { length: Math.max(kept.length, length) },
      (_, at) => (at < length ? (locks[at] ?? null) : (kept[at] ?? null)),
    );
    values[index] = value;
    return {
      type: 'setControlOptions',
      scope: scopeId,
      key,
      options: {
        stepValues: values.some((step) => step !== null) ? values : undefined,
        ...(legacy ? { perStep: lane.sequence } : {}),
      },
    };
  }

  /** Every step of a lane back to following the single value (one operation). Null when none holds its own. */
  laneResetOperation(scopeId: string, key: string): Operation | null {
    const state = valuesOf(this.ctx.host.getDoc(), scopeId)?.controls[key];
    if (state?.options?.stepValues === undefined) return null;
    return {
      type: 'setControlOptions',
      scope: scopeId,
      key,
      options: { stepValues: undefined },
    };
  }

  /** The lane follows another sequence (its steps' values stay as they are, step for step). */
  laneSequenceOperation(
    scopeId: string,
    key: string,
    sequence: string,
  ): Operation | null {
    const runtime = this.ctx.scopes.get(scopeId);
    const declaration = runtime?.declarations.find((d) => d.key === key);
    const lane =
      runtime && declaration ? this.laneOf(runtime, declaration) : null;
    if (!lane || lane.sequence === sequence) return null;
    return {
      type: 'setControlOptions',
      scope: scopeId,
      key,
      options: { perStep: sequence },
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
  reconcileStepListeners(): void {
    const wanted = new Map<string, { runtime: ScopeRuntime; name: string }>();
    for (const runtime of this.ctx.scopes.values()) {
      for (const declaration of runtime.declarations) {
        const lane = this.activeLane(runtime, declaration);
        if (lane) {
          wanted.set(`${runtime.id}/${lane.sequence}`, {
            runtime,
            name: lane.sequence,
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
        this.onStep(runtime.id, name, event),
      );
      this.#stepListeners.set(key, { sequence, off });
    }
    for (const runtime of this.ctx.scopes.values())
      this.holdStepValues(runtime);
  }

  /** The step of each sequence last set by its listener, by scope and name: what the parameters hold while stopped. */
  readonly lastStep = new Map<string, number>();

  /**
   * A step of a sequence that has per-step controls is about to sound: each of them is set to its
   * value for that step, at the step's time, before the sequence's own callback runs (so a sampler it
   * triggers on this step plays with it). Rests too. Parameter sets and nothing else: no document
   * write, nothing drawn, nothing the UI is waiting on.
   */
  onStep(scopeId: string, name: string, event: SequenceEvent): void {
    const runtime = this.ctx.scopes.get(scopeId);
    if (!runtime) return;
    this.lastStep.set(`${scopeId}/${name}`, event.index);
    this.setStepValues(runtime, name, event.index, event.time);
  }

  setStepValues(
    runtime: ScopeRuntime,
    name: string,
    index: number,
    at: number | undefined,
  ): void {
    const values = valuesOf(this.ctx.host.getDoc(), runtime.id);
    this.ctx.applying = true;
    try {
      for (const declaration of runtime.declarations) {
        const binding = declaration.bindings[0];
        if (binding?.type !== 'param') continue;
        const lane = this.activeLane(runtime, declaration);
        if (!lane || lane.sequence !== name) continue;
        const wanted = this.stepValue(runtime, declaration, name, index);
        const first = reach(runtime, declaration)[0];
        const range = first
          ? metaOf(first.param(binding.param), declaration.options)
          : undefined;
        // A synced speed's steps are multipliers: each is this step's multiplier x the sound's length over
        // the synced sequence's, worked out now, so it follows the tempo, the sequence and the sound.
        const sync = this.ctx.parts.sync.syncOf(runtime, declaration);
        // (otherwise held to the range the control has now: a lane's values may be from a wider one)
        const value =
          typeof wanted !== 'number'
            ? wanted
            : sync
              ? this.ctx.parts.sync.syncedSpeed(
                  runtime,
                  declaration,
                  sync,
                  wanted,
                )
              : range?.kind === 'number'
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
          ...(glide > 0 && typeof value === 'number' ? { glide } : {}),
        };
        for (const node of reach(runtime, declaration)) {
          node.param(binding.param).set(value, how);
        }
      }
    } finally {
      this.ctx.applying = false;
    }
  }

  /** While the transport is stopped a per-step control's parameter holds the step last played, or the first. */
  holdStepValues(runtime: ScopeRuntime): void {
    if (this.ctx.engine.transport.state === 'started') return;
    const names = new Set<string>();
    for (const declaration of runtime.declarations) {
      const lane = this.activeLane(runtime, declaration);
      if (lane) names.add(lane.sequence);
    }
    for (const name of names) {
      const steps = runtime.scope.transport.get(name)?.steps.length ?? 0;
      const last = this.lastStep.get(`${runtime.id}/${name}`) ?? 0;
      this.setStepValues(runtime, name, last < steps ? last : 0, undefined);
    }
  }
}
