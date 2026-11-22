/**
 * A speed synced to a sequence: how a control stands when its unit is "sequence sync", the speed a
 * multiplier comes to at this tempo and sound, putting every synced speed where it belongs after a change,
 * and the operations that choosing a unit comes to.
 */

import { type Declaration } from 'client-v2/controls/declarations';
import { familyOf, nearestSync } from 'client-v2/controls/modes';
import { type Operation } from 'client-v2/project/operations';
import {
  SYNC,
  type ScopeRuntime,
  type Sync,
} from 'client-v2/audio/runner/types';
import {
  valuesOf,
  heardKey,
  select,
  reach,
  metaOf,
} from 'client-v2/audio/runner/access';
import type { RunnerContext } from 'client-v2/audio/runner/context';

export class SequenceSync {
  readonly ctx: RunnerContext;

  constructor(ctx: RunnerContext) {
    this.ctx = ctx;
  }

  /** The named sequences of a scope's script, in the order it makes them. */
  sequenceNames(runtime: ScopeRuntime): string[] {
    return runtime.scope.transport.sequences
      .map((sequence) => sequence.name)
      .filter((name): name is string => name !== null);
  }

  /**
   * How long one pass of a sequence lasts at the tempo now, by the library's own reckoning of the
   * options the sequence has: its span, or its number of steps times its step length.
   */
  sequenceSeconds(runtime: ScopeRuntime, name: string): number | null {
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
  isSpeed(runtime: ScopeRuntime, declaration: Declaration): boolean {
    const binding = declaration.bindings[0];
    if (binding?.type !== 'param') return false;
    const node = select(runtime, binding.selector)[0];
    if (!node || !(binding.param in node.params)) return false;
    const meta = metaOf(node.param(binding.param), declaration.options);
    return (
      meta.kind === 'number' &&
      familyOf({ ...meta, name: binding.param }) === 'speed'
    );
  }

  /**
   * How a control stands if it is a speed synced to a sequence (by the person's choice of unit, else
   * by the script's `mode: 'sequence-sync'`); null for any other control.
   */
  syncOf(runtime: ScopeRuntime, declaration: Declaration): Sync | null {
    const state = valuesOf(this.ctx.host.getDoc(), runtime.id)?.controls[
      declaration.key
    ];
    const chosen = state?.options?.mode;
    if ((chosen ?? declaration.options.mode) !== SYNC) return null;
    if (!this.isSpeed(runtime, declaration)) return null;
    const binding = declaration.bindings[0];
    if (binding?.type !== 'param') return null;
    // (the sequence named with the person's choice; else the script's option; else its first)
    const sequence =
      (chosen === SYNC ? state?.options?.sequence : undefined) ??
      declaration.options.sequence ??
      this.sequenceNames(runtime)[0] ??
      null;
    if (sequence === null) {
      return {
        sequence,
        factor: null,
        why: 'Nothing to sync to: this script has no named sequence. Playing at normal speed.',
      };
    }
    const seconds = this.sequenceSeconds(runtime, sequence);
    if (seconds === null) {
      return {
        sequence,
        factor: null,
        why: `Nothing to sync to: this script has no sequence named '${sequence}'. Playing at normal speed.`,
      };
    }
    const node = select(runtime, binding.selector)[0];
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
  syncedSpeed(
    runtime: ScopeRuntime,
    declaration: Declaration,
    sync: Sync,
    multiplier: number,
  ): number {
    if (sync.factor === null) return 1;
    const binding = declaration.bindings[0];
    const node =
      binding?.type === 'param'
        ? select(runtime, binding.selector)[0]
        : undefined;
    const meta =
      binding?.type === 'param' && node
        ? metaOf(node.param(binding.param), declaration.options)
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
  resync(runtime: ScopeRuntime): void {
    const values = valuesOf(this.ctx.host.getDoc(), runtime.id);
    for (const declaration of runtime.declarations) {
      const binding = declaration.bindings[0];
      if (binding?.type !== 'param') continue;
      const sync = this.syncOf(runtime, declaration);
      if (!sync) continue;
      const per = this.ctx.parts.lanes.activeLane(runtime, declaration);
      if (per) {
        // each step applies its own multiplier x factor as it comes; while stopped, the step it holds
        const last =
          this.ctx.parts.lanes.lastStep.get(`${runtime.id}/${per.sequence}`) ??
          0;
        const steps =
          runtime.scope.transport.get(per.sequence)?.steps.length ?? 0;
        if (this.ctx.engine.transport.state !== 'started') {
          this.ctx.parts.lanes.setStepValues(
            runtime,
            per.sequence,
            last < steps ? last : 0,
            undefined,
          );
        }
        continue;
      }
      const stored = values?.controls[declaration.key]?.value;
      const speed = this.syncedSpeed(
        runtime,
        declaration,
        sync,
        typeof stored === 'number' ? stored : 1,
      );
      this.ctx.applying = true;
      try {
        for (const node of reach(runtime, declaration)) {
          if (node.param(binding.param).value !== speed) {
            node.param(binding.param).set(speed);
          }
          runtime.heard.set(heardKey(node, binding.param), speed);
        }
      } finally {
        this.ctx.applying = false;
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
    const runtime = this.ctx.scopes.get(scopeId);
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
    const before = this.syncOf(runtime, declaration);
    if (!before && !toSync) return operations;
    const node = select(runtime, binding.selector)[0];
    const name = options.sequence ?? this.sequenceNames(runtime)[0];
    const seconds =
      name === undefined ? null : this.sequenceSeconds(runtime, name);
    const length = node?.buffer?.buffer?.duration;
    const factor = seconds && length ? length / seconds : null;
    // a value of the old unit as the speed it is, and as the new unit's number
    const speedOf = (value: number): number =>
      before ? (before.factor === null ? 1 : before.factor * value) : value;
    const inNew = (speed: number): number =>
      toSync ? (factor === null ? 1 : nearestSync(speed / factor)) : speed;
    const state = valuesOf(this.ctx.host.getDoc(), scopeId)?.controls[key];
    const per = this.ctx.parts.lanes.activeLane(runtime, declaration);
    // The single value: the speed it is playing at (a per-step control's parameter is wherever its
    // step put it, so there the speed the single value stands for).
    const playing = node?.param(binding.param).value;
    const single =
      per || typeof playing !== 'number'
        ? typeof state?.value === 'number'
          ? speedOf(state.value)
          : before
            ? speedOf(1)
            : undefined
        : playing;
    if (single !== undefined) {
      operations.push({
        type: 'setControlValue',
        scope: scopeId,
        key,
        value: inNew(single),
      });
    }
    // Every step of a lane goes with it, so each sounds as near as the unit allows.
    const steps = state?.options?.stepValues;
    if (steps) {
      operations.push({
        type: 'setControlOptions',
        scope: scopeId,
        key,
        options: {
          stepValues: steps.map((value) =>
            typeof value === 'number' ? inNew(speedOf(value)) : value,
          ),
        },
      });
    }
    return operations;
  }
}
