/**
 * What the controls pane draws: every declared control as a ControlView (its range, unit, value, where the
 * parameter really is, glide and lane), where the script's nodes sit in the order of things, and how a
 * control's parameter follows it. Reads the scopes; changes nothing.
 */

import type { Node } from 'cracked-up';
import { type Declaration } from 'client-v2/controls/declarations';
import { liveRange } from 'client-v2/controls/live-range';
import {
  availableModes,
  defaultMode,
  isModeName,
  mapping,
  MODE_LABELS,
  nearestSync,
} from 'client-v2/controls/modes';
import { sameValue } from 'client-v2/project/operations';
import {
  PROJECT_SCOPE,
  type ScopeValues,
  type StoredValue,
} from 'client-v2/project/schema';
import {
  EFFECTIVE_DELAY_MS,
  FOLLOW,
  SYNC,
  syncChoice,
  OWN_GROUP,
  type ControlGroup,
  type ControlMeta,
  type ControlView,
  type GlideView,
  type ModeChoice,
  type ScopeRuntime,
  type Layout,
} from 'client-v2/audio/runner/types';
import {
  valuesOf,
  heardKey,
  busHeardKey,
  samePlace,
  select,
  reach,
  ownNodes,
  metaOf,
  busOf,
  isSource,
} from 'client-v2/audio/runner/access';
import type { RunnerContext } from 'client-v2/audio/runner/context';

export class ControlViews {
  readonly ctx: RunnerContext;

  constructor(ctx: RunnerContext) {
    this.ctx = ctx;
  }

  /** Every declared control as the UI draws it; `all` includes the parts of compound widgets. */
  controlViews(scopeId: string, all: boolean): ControlView[] {
    const runtime = this.ctx.scopes.get(scopeId);
    if (!runtime) return [];
    const values = valuesOf(this.ctx.host.getDoc(), scopeId);
    const layout = this.layout(runtime);
    const stepSeconds = this.stepSeconds(runtime);
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
        const nodes = select(runtime, binding.selector);
        const node = nodes[0];
        if (!node || !(binding.param in node.params)) continue;
        const param = node.param(binding.param);
        sweepable = param.meta.kind === 'number' && param.meta.rate === 'audio';
        const range = liveRange(
          { engine: this.ctx.engine, node },
          binding.param,
        );
        meta = metaOf(param, options);
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
        const reached = reach(runtime, declaration);
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
          if (isSource(this.ctx.engine, node)) source = node.id;
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
        const bus = busOf(this.ctx.engine, runtime, binding.name);
        if (!bus) continue;
        meta = metaOf(bus.gain, options);
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
      const sync =
        binding.type === 'param'
          ? this.ctx.parts.sync.syncOf(runtime, declaration)
          : null;
      if (
        binding.type === 'param' &&
        this.ctx.parts.sync.isSpeed(runtime, declaration)
      ) {
        const names = this.ctx.parts.sync.sequenceNames(runtime);
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
        const expected = this.ctx.parts.sync.syncedSpeed(
          runtime,
          declaration,
          sync,
          value,
        );
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
          effective: this.ctx.parts.lanes.activeLane(runtime, declaration)
            ? null // (its parameter is wherever its lane has put it: that is the control's own doing)
            : this.settledAway(runtime, declaration.key, away)
              ? (now as number | boolean | string)
              : null,
          stored: stored !== undefined,
          mode,
          modes,
          choices,
          choice,
          ...this.ctx.parts.lanes.laneInfo(runtime, declaration),
          ...(meta.kind === 'number'
            ? glideWhy === undefined
              ? { glide: this.glideOf(runtime, values, declaration) }
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
  settledAway(runtime: ScopeRuntime, key: string, away: boolean): boolean {
    if (!away) {
      runtime.differing.delete(key);
      return false;
    }
    if (!this.ctx.realtime) return true;
    const now = performance.now();
    const since = runtime.differing.get(key);
    if (since === undefined) {
      runtime.differing.set(key, now);
      const timer = setTimeout(() => {
        this.ctx.timers.delete(timer);
        if (runtime.differing.has(key)) this.ctx.host.changed();
      }, EFFECTIVE_DELAY_MS + 10);
      this.ctx.timers.add(timer);
      return false;
    }
    return now - since >= EFFECTIVE_DELAY_MS;
  }

  /**
   * Where each of the script's nodes is: its place in the order the script made them, which chain it
   * is part of (nodes joined by connections, directly or through a parameter one modulates), and which
   * of its type it is when the script has several.
   */
  layout(runtime: ScopeRuntime): Layout {
    const nodes = ownNodes(runtime);
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

  /**
   * How long one step of the scope's sequence lasts at the tempo now, for times shown in steps: the
   * first sequence the script declares a step grid for, else its first sequence, else the transport's
   * own step length.
   */
  stepSeconds(runtime: ScopeRuntime): number | null {
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

  /** How long a control's parameter takes to get where the control is put, as things stand. */
  glideOf(
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
  howFor(runtime: ScopeRuntime, key: string): { glide: number } | undefined {
    const view = this.controlViews(runtime.id, true).find(
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
}
