/**
 * Plain functions the runner's parts share: reading what a project document holds for a scope, finding a
 * scope's nodes and buses, describing an error, and the two small judgements (who has the better claim
 * to a parameter; whether a parameter is where its control is). None keeps state.
 */

import type { Bus, Engine, Node, Param } from 'cracked-up';
import {
  HOST_TAG,
  type ControlOptions,
  type Declaration,
} from 'client-v2/controls/declarations';
import {
  mapping,
  type ModeName,
  type NumberMeta,
} from 'client-v2/controls/modes';
import {
  PROJECT_SCOPE,
  type ProjectDocument,
  type ScopeValues,
} from 'client-v2/project/schema';
import {
  SAME_PLACE,
  type ControlMeta,
  type ScopeRuntime,
  type ScriptError,
} from 'client-v2/audio/runner/types';
export function describeError(
  error: unknown,
  sequence?: string | null,
): ScriptError {
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

export function valuesOf(
  doc: ProjectDocument,
  scopeId: string,
): ScopeValues | null {
  if (scopeId === PROJECT_SCOPE) return doc.values;
  return doc.tracks.find((track) => track.id === scopeId)?.values ?? null;
}

export function scriptOf(doc: ProjectDocument, scopeId: string): string | null {
  if (scopeId === PROJECT_SCOPE) return doc.script;
  return doc.tracks.find((track) => track.id === scopeId)?.script ?? null;
}

export const heardKey = (node: Node, param: string): string =>
  `${node.id}/${param}`;
/** (a bus's level is the gain of a node the library keeps for it, called `bus:<name>`) */
export const busHeardKey = (bus: string): string => `bus:${bus}/gain`;

/** How good a declaration's claim to a parameter is: a compound widget's part, controls(), an explicit control. */
export function rankOf(declaration: Declaration): number {
  return declaration.hidden ? 0 : declaration.implicit ? 1 : 2;
}

/**
 * Whether a parameter is where its control is, to the control's own resolution: the same place along
 * its travel in the unit it is in (so a control in whole notes does not call a few cents "elsewhere"),
 * or the same number as near as a 32-bit audio parameter holds one.
 */
export function samePlace(
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

/** The scope's own nodes: what its script made (not other scopes', not the insides of macros). */
export function ownNodes(runtime: ScopeRuntime): Node[] {
  return [...runtime.scope.select('*')].filter(
    (node) =>
      node.scope === runtime.scope &&
      node.parent === null &&
      node.tags[HOST_TAG] === undefined,
  );
}

/** The nodes a selector finds, as the script's own `__(selector)` would, without the host's own. */
export function select(runtime: ScopeRuntime, selector: string): Node[] {
  try {
    return [...runtime.scope.$(selector)].filter(
      (node) => node.tags[HOST_TAG] === undefined,
    );
  } catch {
    return [];
  }
}

/** Every node a control's parameter bindings reach now. */
export function reach(runtime: ScopeRuntime, declaration: Declaration): Node[] {
  return declaration.bindings.flatMap((binding) =>
    binding.type === 'param'
      ? select(runtime, binding.selector).filter(
          (node) => binding.param in node.params,
        )
      : [],
  );
}

/** A bus of the scope by name, without making one: null if the scope has no such bus. */
export function busOf(
  engine: Engine,
  runtime: ScopeRuntime,
  name: string,
): Bus | null {
  const own =
    (name === 'main' && runtime.scope === engine.root) ||
    runtime.scope.snapshot().buses.some((bus) => bus.name === name);
  return own ? runtime.scope.bus(name) : null;
}

/** What the library says a node type is, for the few things the runner needs to know of it. */
export function typeInfo(
  engine: Engine,
  type: string,
): { source: boolean; macro: boolean; pitchTrigger: boolean } | null {
  try {
    const info = engine.registry.describe(type);
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

/**
 * Whether a node is a source of sound, by what the library says its type is: category 'source'
 * (sampler, the oscillators, noise), or a synth macro (category 'synth': a macro that makes sound
 * from triggers and takes none in). The library does not say whether a macro of another category has
 * an audio input, so one of those is not told apart from an effect: it stays under processors.
 */
export function isSource(engine: Engine, node: Node): boolean {
  return typeInfo(engine, node.type)?.source === true;
}

/** The parameter's metadata, narrowed by what the declaration's options say. */
export function metaOf(param: Param, options: ControlOptions): ControlMeta {
  const meta = param.meta;
  if (meta.kind === 'boolean') return { kind: 'boolean' };
  if (meta.kind === 'choice') return { kind: 'choice', choices: meta.choices };
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
