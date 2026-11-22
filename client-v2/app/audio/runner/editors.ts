/**
 * What the source tab, the step grids and the editors' catalog show (waveforms, synths, step grids), and
 * playing a source for the ear (held notes, auditioning a sampler). Reads the scopes; changes nothing in
 * the document.
 */

import type { Node } from 'cracked-up';
import { BUFFER_OPTION } from 'client-v2/controls/declarations';
import { PROJECT_SCOPE, controlKey } from 'client-v2/project/schema';
import {
  FOLLOW,
  OUT_BUS,
  type StepGridView,
  type LiveCatalog,
  type WaveformView,
  type SynthView,
  type SourceView,
  type ScopeRuntime,
} from 'client-v2/audio/runner/types';
import { valuesOf, ownNodes, typeInfo } from 'client-v2/audio/runner/access';
import type { RunnerContext } from 'client-v2/audio/runner/context';

export class Editors {
  readonly ctx: RunnerContext;

  constructor(ctx: RunnerContext) {
    this.ctx = ctx;
  }

  /** The waveform editors a script declares, in the order it declared them. */
  waveforms(scopeId: string): WaveformView[] {
    const runtime = this.ctx.scopes.get(scopeId);
    if (!runtime) return [];
    const declarations = runtime.declarations.filter(
      (declaration) => declaration.kind === 'waveform',
    );
    if (declarations.length === 0) return [];
    const controls = new Map(
      this.ctx.parts.views
        .controlViews(scopeId, true)
        .map((view) => [view.key, view]),
    );
    const values = valuesOf(this.ctx.host.getDoc(), scopeId);
    const layout = this.ctx.parts.views.layout(runtime);
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
        ...this.soundDefault(runtime, soundKey),
        soundKey,
        params,
      });
    }
    return views;
  }

  /** The synth editors a script declares, in the order it declared them. */
  synths(scopeId: string): SynthView[] {
    const runtime = this.ctx.scopes.get(scopeId);
    if (!runtime) return [];
    const declarations = runtime.declarations.filter(
      (declaration) => declaration.kind === 'synth',
    );
    if (declarations.length === 0) return [];
    const controls = new Map(
      this.ctx.parts.views
        .controlViews(scopeId, true)
        .map((view) => [view.key, view]),
    );
    const layout = this.ctx.parts.views.layout(runtime);
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
      const info = typeInfo(this.ctx.engine, node.type);
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
        // (a macro with a pitch parameter of its own, a monosynth's frequency, keeps the keyboard's note)
        playsNote: (info?.pitchTrigger ?? false) && param === null,
      });
    }
    return views;
  }

  /**
   * Every source editor the script declares (waveforms and synths) in the order it declared them: what
   * the source tab lists.
   */
  sources(scopeId: string): SourceView[] {
    const runtime = this.ctx.scopes.get(scopeId);
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
    const runtime = this.ctx.scopes.get(scopeId);
    const node = this.sampler(scopeId, nodeId);
    if (!runtime || !node) return false;
    this.releaseNote(scopeId, nodeId);
    const info = typeInfo(this.ctx.engine, node.type);
    const held: Node[] = [];
    if (info?.pitchTrigger) {
      node.trigger({ pitch: note.midi });
      held.push(node);
    } else {
      if (note.param !== null && note.param in node.params) {
        node.param(note.param).set(note.hz, FOLLOW);
      }
      const chain = this.triggerChain(node);
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
  triggerChain(start: Node): Node[] {
    const found: Node[] = [];
    const seen = new Set<Node>();
    const visit = (node: Node, depth: number): void => {
      if (seen.has(node) || depth > 12) return;
      seen.add(node);
      const info = this.triggerable(node.type);
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

  triggerable(type: string): boolean {
    try {
      const info = this.ctx.engine.registry.describe(type);
      return info.triggerable && info.category !== 'io';
    } catch {
      return false;
    }
  }

  soundDefault(
    runtime: ScopeRuntime,
    soundKey: string,
  ): { soundDefault?: boolean } {
    const doc = this.ctx.host.getDoc();
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
    const runtime = this.ctx.scopes.get(scopeId);
    if (!runtime) return undefined;
    return ownNodes(runtime).find((node) => node.id === nodeId);
  }

  /** The declared step grids, in the order the script declared them. */
  stepGrids(scopeId: string): StepGridView[] {
    const runtime = this.ctx.scopes.get(scopeId);
    if (!runtime) return [];
    const values = valuesOf(this.ctx.host.getDoc(), scopeId);
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

  /** What the editors' catalog is to offer from the live project. */
  catalog(): LiveCatalog {
    const doc = this.ctx.host.getDoc();
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
    for (const runtime of this.ctx.scopes.values()) {
      for (const node of ownNodes(runtime)) {
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
        const ref = this.ctx.engine.buffers.get(key);
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
}
