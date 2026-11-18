/**
 * What the Signal chain tab draws: rows of boxes, made from the library's own graph model
 * (`cracked-up/inspect`'s `buildModel`, which says which nodes carry audio, which carry control
 * signals, which are inserts of a bus, and where each bus goes). This module is pure: it only arranges
 * that model into rows, so it is tested without audio.
 *
 * - A **chain** row follows audio from a node nothing feeds to where it goes: a bus (the track's
 *   `channel`, or one of its own), the speakers, or nowhere. A node with two outgoing connections gives
 *   a second row that carries on from the same node (marked as a branch): the graph is drawn truthfully,
 *   not simplified away.
 * - A **modulator** row follows control signals (an lfo) to the parameter they move.
 * - A **bus** row is a bus's inserts in order, then where the bus goes.
 */
import type { ViewGraph, ViewNode } from 'cracked-up/inspect';

export interface ChainNode {
  /** the node's id (generated when the script gave none) */
  id: string;
  type: string;
  category: string | null;
  /** the id was made by the library: the script gave the node none */
  autoId: boolean;
  /** which un-id'd node of its type this is, counted from 1 in creation order; null when it has an id */
  ordinal: number | null;
  bypassed: boolean;
  macro: boolean;
}

export type ChainDestination =
  /** a bus: its name (`channel` for the track's own strip) */
  | { kind: 'bus'; name: string }
  | { kind: 'output'; name: string }
  /** a parameter of a node, for a modulator */
  | { kind: 'param'; name: string; node: ChainNode; param: string }
  | { kind: 'none'; name: string };

export interface ChainRow {
  key: string;
  kind: 'chain' | 'modulator' | 'bus';
  /** what to call it when it needs a name: `drums bus`, `lfo → filter.frequency` */
  title: string | null;
  nodes: ChainNode[];
  destination: ChainDestination;
  /** a continuation of an earlier row from a node with two connections out */
  branch: boolean;
  /** for a bus row: the bus's name */
  bus: string | null;
}

export interface ChainGraph {
  rows: ChainRow[];
}

/** What a node is called where it is named: its id if the script gave one, else its type. */
export function nameOf(node: ChainNode): string {
  return node.autoId ? node.type : node.id;
}

export function chainNodesOf(view: ViewGraph): Map<string, ChainNode> {
  const counts = new Map<string, number>();
  const nodes = new Map<string, ChainNode>();
  for (const node of view.nodes) {
    if (node.kind !== 'node') continue;
    let ordinal: number | null = null;
    if (node.autoId) {
      ordinal = (counts.get(node.type) ?? 0) + 1;
      counts.set(node.type, ordinal);
    }
    nodes.set(node.key, {
      id: node.id,
      type: node.type,
      category: node.category,
      autoId: node.autoId,
      ordinal,
      bypassed: node.bypassed,
      macro: node.macro,
    });
  }
  return nodes;
}

const MAX_ROWS = 40;

export function buildChainGraph(view: ViewGraph): ChainGraph {
  const chainNodes = chainNodesOf(view);
  const byKey = new Map<string, ViewNode>(
    view.nodes.map((node) => [node.key, node]),
  );
  const out = new Map<string, string[]>();
  const into = new Map<string, string[]>();
  const modulations = new Map<string, { to: string; param: string }[]>();
  for (const edge of view.edges) {
    if (edge.kind === 'modulation') {
      const list = modulations.get(edge.from) ?? [];
      list.push({ to: edge.to, param: edge.param ?? '' });
      modulations.set(edge.from, list);
    } else if (edge.kind === 'audio' || edge.kind === 'route') {
      out.set(edge.from, [...(out.get(edge.from) ?? []), edge.to]);
      into.set(edge.to, [...(into.get(edge.to) ?? []), edge.from]);
    }
  }

  const isPlain = (node: ViewNode | undefined): node is ViewNode =>
    node !== undefined && node.kind === 'node' && node.insertOf === null;
  const isAudio = (node: ViewNode | undefined): node is ViewNode =>
    isPlain(node) && node.signal === 'audio';
  const isControl = (node: ViewNode | undefined): node is ViewNode =>
    isPlain(node) && node.signal === 'control';

  const rows: ChainRow[] = [];
  const add = (row: Omit<ChainRow, 'key'>): void => {
    if (rows.length < MAX_ROWS)
      rows.push({ ...row, key: `row-${rows.length}` });
  };
  const nodeOf = (key: string): ChainNode => chainNodes.get(key)!;

  /** Where a connection to `key` goes, for a row that ends there; null: the row goes on through it. */
  const endAt = (key: string): ChainDestination | null => {
    const node = byKey.get(key);
    if (!node) return { kind: 'none', name: 'nowhere' };
    if (node.kind === 'bus') return { kind: 'bus', name: node.id };
    if (node.kind === 'output') return { kind: 'output', name: 'dac' };
    if (node.insertOf !== null) return { kind: 'bus', name: node.insertOf };
    return null;
  };

  // --- audio chains
  const seen = new Set<string>();
  const walk = (start: string, via: string[], branch: boolean): void => {
    const path = [...via, start];
    const next = out.get(start) ?? [];
    let first = true;
    let ended = false;
    for (const to of next) {
      const node = byKey.get(to);
      if (node && node.kind === 'node' && node.signal === 'control') continue;
      const end = endAt(to);
      if (end) {
        add({
          kind: 'chain',
          title: null,
          nodes: path.map(nodeOf),
          destination: end,
          branch: branch || !first,
          bus: null,
        });
        first = false;
        ended = true;
      } else if (!path.includes(to)) {
        walk(to, path, branch || !first);
        first = false;
        ended = true;
      }
    }
    for (const key of path) seen.add(key);
    if (!ended) {
      add({
        kind: 'chain',
        title: null,
        nodes: path.map(nodeOf),
        destination: { kind: 'none', name: 'nowhere' },
        branch,
        bus: null,
      });
    }
  };
  const audio = view.nodes.filter(isAudio);
  for (const node of audio) {
    const feeders = (into.get(node.key) ?? []).filter((key) =>
      isAudio(byKey.get(key)),
    );
    if (feeders.length === 0) walk(node.key, [], false);
  }
  // whatever a loop kept from having a start
  for (const node of audio) if (!seen.has(node.key)) walk(node.key, [], false);

  // --- buses: their inserts in order, then where they go
  for (const bus of view.nodes) {
    if (bus.kind !== 'bus' || bus.external) continue;
    const inserts = view.nodes.filter(
      (node) => node.kind === 'node' && node.insertOf === bus.id,
    );
    const ordered: ViewNode[] = [];
    const starts = inserts.filter(
      (node) =>
        !(into.get(node.key) ?? []).some(
          (key) => byKey.get(key)?.insertOf === bus.id,
        ),
    );
    let at: ViewNode | undefined = starts[0];
    while (at && !ordered.includes(at)) {
      ordered.push(at);
      at = inserts.find((node) => (out.get(at!.key) ?? []).includes(node.key));
    }
    const route = (out.get(bus.key) ?? [])[0];
    add({
      kind: 'bus',
      title: `${bus.id} bus`,
      nodes: ordered.map((node) => nodeOf(node.key)),
      destination: route
        ? (endAt(route) ?? { kind: 'none', name: 'nowhere' })
        : { kind: 'none', name: 'nowhere' },
      branch: false,
      bus: bus.id,
    });
  }

  // --- modulators: control signals, to the parameter they move
  const controls = view.nodes.filter(isControl);
  const walkControl = (start: string, via: string[]): void => {
    const path = [...via, start];
    const targets = modulations.get(start) ?? [];
    const next = (out.get(start) ?? []).filter((key) =>
      isControl(byKey.get(key)),
    );
    targets.forEach((target, index) => {
      const node = chainNodes.get(target.to);
      if (!node) return;
      add({
        kind: 'modulator',
        title: `${nameOf(nodeOf(path[0]!))} → ${nameOf(node)}.${target.param}`,
        nodes: path.map(nodeOf),
        destination: {
          kind: 'param',
          name: `${nameOf(node)}.${target.param}`,
          node,
          param: target.param,
        },
        branch: index > 0,
        bus: null,
      });
    });
    for (const to of next) if (!path.includes(to)) walkControl(to, path);
    if (targets.length === 0 && next.length === 0) {
      add({
        kind: 'modulator',
        title: nameOf(nodeOf(path[0]!)),
        nodes: path.map(nodeOf),
        destination: { kind: 'none', name: 'nowhere' },
        branch: false,
        bus: null,
      });
    }
  };
  for (const node of controls) {
    const feeders = (into.get(node.key) ?? []).filter((key) =>
      isControl(byKey.get(key)),
    );
    if (feeders.length === 0) walkControl(node.key, []);
  }

  return { rows };
}
