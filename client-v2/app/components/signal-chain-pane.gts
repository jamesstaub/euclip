import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import { modifier } from 'ember-modifier';
import Hint from 'client-v2/components/ui/hint';
import {
  nameOf,
  type ChainGraph,
  type ChainNode,
  type ChainRow,
} from 'client-v2/audio/chain-view';
import { PROJECT_SCOPE } from 'client-v2/project/schema';
import type { NodeTypeInfo } from 'cracked-up';
import {
  addBus,
  addModulator,
  addNode,
  analyze,
  busNameProblem,
  find,
  isAnalysis,
  isCannot,
  moveNode,
  planModulator,
  planRemove,
  planSend,
  removeModulator,
  removeNode,
  retarget,
  sendTo,
  suggestDepth,
  type EditContext,
  type EditResult,
  type NodeRef,
  type RemovePlan,
} from 'client-v2/script-edit/edit';
import type { Analysis, Cannot } from 'client-v2/script-edit/analyze';
import type AudioService from 'client-v2/services/audio';
import type ProjectService from 'client-v2/services/project';
import type ViewService from 'client-v2/services/view';

export interface SignalChainPaneSignature {
  Element: HTMLElement;
  Args: {
    /** a track's id, or the project scope */
    scopeId: string;
    /** the track's name, for accessible names */
    label: string;
    /** a node was chosen: the track it is in is chosen too (so the footer shows it) */
    onSelectTrack?: (scopeId: string) => void;
  };
}

/** The groups the picker lists node types in, by the library's own categories. */
const GROUPS: readonly { title: string; categories: readonly string[] }[] = [
  { title: 'Sources', categories: ['source', 'synth'] },
  { title: 'Filters', categories: ['filter'] },
  { title: 'Dynamics', categories: ['dynamics'] },
  { title: 'Delay and reverb', categories: ['delay'] },
  { title: 'Distortion', categories: ['distortion'] },
  { title: 'Utility', categories: ['utility'] },
  { title: 'Envelopes', categories: ['envelope'] },
  { title: 'Input and output', categories: ['io'] },
];

interface PickerGroup {
  title: string;
  types: { type: string; description: string }[];
}

/** What is chosen on the drawing: a node (by its id), or the chip a row ends at (by the row's key). */
interface Chosen {
  kind: 'node' | 'dest';
  id: string;
}

/** A number parameter the library can modulate: audio-rate ones (its `rate`), which it documents as targets. */
type NumberParam = Extract<NodeTypeInfo['params'][number], { kind: 'number' }>;

/** What a bus has of its own, so these types are not offered as its inserts (see script-edit/edit.ts). */
const BUS_OWN = new Set(['gain', 'input']);

let actions = 0;

let kept: {
  text: string;
  usedIds: string | undefined;
  value: Analysis | Cannot;
} | null = null;

/** The script read once for as long as neither it nor the ids the graph has change. */
function analysed(text: string, context: EditContext): Analysis | Cannot {
  const usedIds = context.usedIds?.join();
  if (kept && kept.text === text && kept.usedIds === usedIds) return kept.value;
  const value = analyze(text, context);
  kept = { text, usedIds, value };
  return value;
}

const showModal = modifier((dialog: HTMLDialogElement) => {
  if (!dialog.open) dialog.showModal();
});

/**
 * The "signal chain" pane: what the running script made, drawn left to right, and the way to change it
 * without opening the editor.
 *
 * It *draws* the live graph (the library's own model of the running scope), so the picture is complete
 * and true whatever the script looks like. It *edits* by rewriting the script's text, exactly as if the
 * person had typed it (`script-edit/`): one undo step per action, run at once, and if the new text does
 * not build the previous version keeps running and the error shows as it does for typed code. Where the
 * script is in a shape Euclip cannot find the place in, the node is marked "edit in script" and its
 * actions are disabled, with the reason beside them.
 *
 * Choosing a node selects it and shows its actions (a bar, not a hover menu); choosing it again, or
 * Enter on it a second time, opens it: a sampler in the source pane, any other node in its section of the
 * controls pane.
 */
export default class SignalChainPane extends Component<SignalChainPaneSignature> {
  @service declare audio: AudioService;
  @service declare project: ProjectService;
  @service declare view: ViewService;

  @tracked chosen: Chosen | null = null;
  /** the picker is open: where the new node goes */
  @tracked picking: { side: 'before' | 'after'; id: string } | null = null;
  @tracked query = '';
  /** removing needs a word first: what it would take with it */
  @tracked confirming: { id: string; plan: RemovePlan } | null = null;
  /** what the last action could not do, in words */
  @tracked problem: string | null = null;
  /** the "Send to…" list is open for this row */
  @tracked sending: string | null = null;
  @tracked newBus = '';
  @tracked newBusOpen = false;
  /** the "Add modulator" dialog is open for this node, with the parameter picked */
  @tracked modulating: { id: string; param: string } | null = null;
  /** the "Retarget" list is open for this modulator */
  @tracked retargeting: string | null = null;

  get graph(): ChainGraph | null {
    return this.audio.chainGraph(this.args.scopeId);
  }

  get rows(): ChainRow[] {
    return this.graph?.rows ?? [];
  }

  get hasError(): boolean {
    return this.audio.error(this.args.scopeId) !== null;
  }

  // --- the script and what Euclip can do with it -----------------------------------------------------

  get script(): string {
    const doc = this.project.doc;
    return this.args.scopeId === PROJECT_SCOPE
      ? doc.script
      : (doc.tracks.find((track) => track.id === this.args.scopeId)?.script ??
          '');
  }

  get context(): EditContext {
    const types = this.audio.nodeTypes();
    const ids = new Set<string>();
    for (const row of this.rows) for (const node of row.nodes) ids.add(node.id);
    return {
      nodeTypes: new Set(types.map((info) => info.type)),
      sourceTypes: new Set(
        types
          .filter(
            (info) => info.category === 'source' || info.category === 'synth',
          )
          .map((info) => info.type),
      ),
      modulatorTypes: new Set(
        types
          .filter((info) => info.category === 'modulator')
          .map((info) => info.type),
      ),
      shorthands: Object.fromEntries(
        types.flatMap((info) =>
          info.shorthand === null ? [] : [[info.type, info.shorthand]],
        ),
      ),
      usedIds: [...ids],
    };
  }

  get analysis(): Analysis | Cannot {
    return analysed(this.script, this.context);
  }

  /** Every node of the drawing, by id (a node in two rows is one). */
  get nodes(): Map<string, ChainNode> {
    const nodes = new Map<string, ChainNode>();
    for (const row of this.rows)
      for (const node of row.nodes) nodes.set(node.id, node);
    return nodes;
  }

  refOf = (node: ChainNode): NodeRef => ({
    id: node.id,
    type: node.type,
    ordinal: node.ordinal,
    siblings: [...this.nodes.values()].filter(
      (other) => other.type === node.type && other.autoId,
    ).length,
  });

  /** Why a node cannot be edited, or null when its place in the script is found. */
  whyNot = (node: ChainNode): string | null => {
    if (this.hasError) {
      return 'The script has an error. Fix it, or undo, before editing here.';
    }
    const analysis = this.analysis;
    if (!isAnalysis(analysis)) return analysis.cannot;
    const place = find(analysis, this.refOf(node));
    return isCannot(place) ? place.cannot : null;
  };

  isReadOnly = (node: ChainNode): boolean =>
    !this.hasError && this.whyNot(node) !== null;

  // --- the chosen node and its actions ----------------------------------------------------------------

  get selected(): ChainNode | null {
    return this.chosen?.kind === 'node'
      ? (this.nodes.get(this.chosen.id) ?? null)
      : null;
  }

  /** The row whose end chip is chosen, if one is. */
  get selectedDest(): ChainRow | null {
    return this.chosen?.kind === 'dest'
      ? (this.rows.find((row) => row.key === this.chosen?.id) ?? null)
      : null;
  }

  /** What kind of row the chosen node is drawn in: a modulator's has other actions. */
  get selectedKind(): ChainRow['kind'] | null {
    const node = this.selected;
    return node
      ? (this.rows.find((row) => row.nodes.some((n) => n.id === node.id))
          ?.kind ?? null)
      : null;
  }

  isSelected = (node: ChainNode): boolean =>
    this.chosen?.kind === 'node' && this.chosen.id === node.id;

  isDestSelected = (row: ChainRow): boolean =>
    this.chosen?.kind === 'dest' && this.chosen.id === row.key;

  /** The number parameters of a node's type that the library can modulate: the audio-rate ones. */
  modulatable = (node: ChainNode): NumberParam[] => {
    const info = this.audio.nodeTypes().find((i) => i.type === node.type);
    if (!info || info.isMacro) return [];
    return info.params.filter(
      (param): param is NumberParam =>
        param.kind === 'number' && param.rate === 'audio',
    );
  };

  get modulatorTypes(): string[] {
    return [...(this.context.modulatorTypes ?? [])].sort();
  }

  /** What each action would say if it cannot be done, for the one chosen (null: it can). */
  get reasons(): Record<
    | 'before'
    | 'after'
    | 'left'
    | 'right'
    | 'remove'
    | 'modulate'
    | 'retarget'
    | 'send',
    string | null
  > {
    const none = {
      before: null,
      after: null,
      left: null,
      right: null,
      remove: null,
      modulate: null,
      retarget: null,
      send: null,
    };
    const check = (result: EditResult | Cannot | null): string | null =>
      result && 'cannot' in result ? result.cannot : null;
    const context = this.context;
    const text = this.script;
    const dest = this.selectedDest;
    if (dest) return { ...none, send: this.sendWhy(dest) };
    const node = this.selected;
    if (!node) return none;
    const why = this.whyNot(node);
    if (why !== null) {
      return {
        before: why,
        after: why,
        left: why,
        right: why,
        remove: why,
        modulate: why,
        retarget: why,
        send: why,
      };
    }
    const ref = this.refOf(node);
    if (this.selectedKind === 'modulator') {
      const plan = check(planModulator(text, ref, context));
      return { ...none, retarget: plan, remove: plan };
    }
    const type = [...context.nodeTypes][0] ?? 'gain';
    return {
      ...none,
      before: check(addNode(text, { at: ref, side: 'before', type }, context)),
      left: check(moveNode(text, { node: ref, direction: 'left' }, context)),
      right: check(moveNode(text, { node: ref, direction: 'right' }, context)),
      modulate:
        this.modulatable(node).length === 0
          ? node.macro
            ? 'This is a macro: the library lets only some of a macro’s parameters be modulated, so do it in the script.'
            : 'This node has no parameter the library can modulate (audio-rate numbers only).'
          : this.modulatorTypes.length === 0
            ? 'The library has no modulator to add.'
            : null,
    };
  }

  /** One sentence for the chosen item: what an action cannot do, or what the last one could not (behind the "?"). */
  get reason(): string | null {
    if (this.problem) return this.problem;
    return (
      Object.values(this.reasons).find(
        (reason): reason is string => reason !== null,
      ) ?? null
    );
  }

  /** The bar is there only while something in this row is chosen. */
  get barShown(): boolean {
    return (
      this.confirming !== null ||
      this.selected !== null ||
      this.selectedDest !== null
    );
  }

  /** A tap on a node chooses it, chooses its track, and shows it in the footer at once. */
  choose = (node: ChainNode): void => {
    this.chosen = { kind: 'node', id: node.id };
    this.confirming = null;
    this.problem = null;
    this.args.onSelectTrack?.(this.args.scopeId);
    this.open(node);
  };

  /** Escape, or a tap on empty space in the chain: nothing is chosen. */
  clear = (): void => {
    this.chosen = null;
    this.confirming = null;
    this.problem = null;
  };

  onKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.barShown) {
      event.stopPropagation();
      this.clear();
    }
  };

  onBackground = (event: Event): void => {
    if ((event.target as Element).closest('button, dialog, [role="toolbar"]')) {
      return;
    }
    this.clear();
  };

  /** A tap on where a chain goes opens its Send to… list; where it cannot be changed, it says why. */
  chooseDest = (row: ChainRow): void => {
    this.args.onSelectTrack?.(this.args.scopeId);
    this.confirming = null;
    this.problem = null;
    if (this.sendWhy(row) === null) {
      this.chosen = null;
      this.newBus = '';
      this.newBusOpen = false;
      this.sending = row.key;
    } else {
      this.chosen = { kind: 'dest', id: row.key };
    }
  };

  /** A tap on the parameter a modulator moves opens the list of places to move it to. */
  chooseTarget = (row: ChainRow): void => {
    const modulator = row.nodes[0];
    if (!modulator) return;
    this.args.onSelectTrack?.(this.args.scopeId);
    this.problem = null;
    const why = this.whyNot(modulator);
    const refused =
      why ??
      (() => {
        const plan = planModulator(
          this.script,
          this.refOf(modulator),
          this.context,
        );
        return plan ? plan.cannot : null;
      })();
    if (refused === null) {
      this.chosen = { kind: 'node', id: modulator.id };
      this.retargeting = modulator.id;
    } else {
      this.chosen = { kind: 'node', id: modulator.id };
      this.problem = refused;
    }
  };

  open = (node: ChainNode): void => {
    if (node.type === 'sampler') {
      const waveform = this.audio
        .waveforms(this.args.scopeId)
        .find((candidate) => candidate.nodeId === node.id);
      this.view.showSourceOf(this.args.scopeId, waveform?.key ?? null);
    } else {
      this.view.showControlsOf(this.args.scopeId, node.id);
    }
  };

  // --- doing it -------------------------------------------------------------------------------------------

  /** Makes a result the script: one undo step, run at once. Says why when it cannot. */
  apply = async (
    result: EditResult,
    options: { choose?: string | null; scope?: string; group?: string } = {},
  ): Promise<boolean> => {
    if ('cannot' in result) {
      this.problem = result.cannot;
      return false;
    }
    this.problem = null;
    const scope = options.scope ?? this.args.scopeId;
    this.project.apply(
      { type: 'setScript', scope, script: result.script },
      { group: options.group ?? `chain-${++actions}` },
    );
    await this.audio.runNow(scope);
    const id = options.choose === undefined ? result.id : options.choose;
    if (id === null) this.chosen = null;
    else if (id !== undefined) this.chosen = { kind: 'node', id };
    return true;
  };

  openPicker = (side: 'before' | 'after'): void => {
    if (!this.selected) return;
    this.query = '';
    this.picking = { side, id: this.selected.id };
  };

  closePicker = (): void => {
    this.picking = null;
  };

  setQuery = (event: Event): void => {
    this.query = (event.target as HTMLInputElement).value;
  };

  get groups(): PickerGroup[] {
    const query = this.query.trim().toLowerCase();
    const allowed = this.pickerTypes;
    const types = this.audio
      .nodeTypes()
      .filter((info) => allowed === null || allowed.has(info.type));
    return GROUPS.flatMap((group) => {
      const list = types
        .filter(
          (info) =>
            group.categories.includes(info.category) &&
            (query === '' ||
              info.type.toLowerCase().includes(query) ||
              info.description.toLowerCase().includes(query) ||
              group.title.toLowerCase().includes(query)),
        )
        .map((info) => ({ type: info.type, description: info.description }))
        .sort((a, b) => a.type.localeCompare(b.type));
      return list.length === 0 ? [] : [{ title: group.title, types: list }];
    });
  }

  get pickingNode(): ChainNode | null {
    return this.picking ? (this.nodes.get(this.picking.id) ?? null) : null;
  }

  add = async (type: string): Promise<void> => {
    const picking = this.picking;
    const node = this.pickingNode;
    this.picking = null;
    if (!picking || !node) return;
    await this.apply(
      addNode(
        this.script,
        { at: this.refOf(node), side: picking.side, type },
        this.context,
      ),
    );
  };

  move = async (direction: 'left' | 'right'): Promise<void> => {
    const node = this.selected;
    if (!node) return;
    await this.apply(
      moveNode(
        this.script,
        { node: this.refOf(node), direction },
        this.context,
      ),
      { choose: node.id },
    );
  };

  remove = async (): Promise<void> => {
    const node = this.selected;
    if (!node) return;
    const plan = planRemove(this.script, this.refOf(node), this.context);
    if ('cannot' in plan) {
      this.problem = plan.cannot;
      return;
    }
    if (plan.wholeStatement || plan.modulators > 0) {
      this.confirming = { id: node.id, plan };
      return;
    }
    await this.#removeNow(node);
  };

  confirmRemove = async (): Promise<void> => {
    const confirming = this.confirming;
    this.confirming = null;
    const node = confirming ? this.nodes.get(confirming.id) : undefined;
    if (node) await this.#removeNow(node);
  };

  cancelRemove = (): void => {
    this.confirming = null;
  };

  async #removeNow(node: ChainNode): Promise<void> {
    await this.apply(removeNode(this.script, this.refOf(node), this.context), {
      choose: null,
    });
  }

  /** What a confirm says: what goes with the node. */
  get confirmText(): string {
    const confirming = this.confirming;
    if (!confirming) return '';
    const parts = [
      confirming.plan.wholeStatement
        ? 'This removes the whole chain it is in, with the controls of every node in it.'
        : 'This removes the node.',
    ];
    if (confirming.plan.modulators > 0) {
      parts.push(
        confirming.plan.modulators === 1
          ? 'The modulator that moves it goes too.'
          : `The ${confirming.plan.modulators} modulators that move it go too.`,
      );
    }
    parts.push('Undo brings it all back.');
    return parts.join(' ');
  }

  // --- destinations ---------------------------------------------------------------------------------------

  /** The script a row's end is written in, and what it says to change: the row's last node, or the bus. */
  #sendFrom = (row: ChainRow): { node: NodeRef } | { bus: string } | null => {
    if (row.kind === 'bus') return row.bus === null ? null : { bus: row.bus };
    const last = row.nodes[row.nodes.length - 1];
    return row.kind === 'chain' && last ? { node: this.refOf(last) } : null;
  };

  sendWhy = (row: ChainRow): string | null => {
    if (this.hasError) {
      return 'The script has an error. Fix it, or undo, before editing here.';
    }
    if (row.destination.kind === 'output') {
      return 'This bus is the last stop: main goes to the speakers.';
    }
    if (row.branch) {
      return 'This chain splits here, so where it goes is changed in the script.';
    }
    const from = this.#sendFrom(row);
    if (!from) return 'This cannot be changed from here.';
    const refused = planSend(this.script, from, this.context);
    return refused ? refused.cannot : null;
  };

  /** The names a chain can be sent to: its track's channel, main, and the buses of the project and of this script. */
  get busNames(): string[] {
    const names: string[] = [];
    if (this.args.scopeId !== PROJECT_SCOPE) names.push('channel');
    names.push('main');
    const own = this.rows
      .filter((row) => row.kind === 'bus')
      .map((row) => row.bus);
    const shared = (this.audio.chainGraph(PROJECT_SCOPE)?.rows ?? [])
      .filter((row) => row.kind === 'bus')
      .map((row) => row.bus);
    for (const name of [...shared, ...own]) {
      if (name !== null && !names.includes(name)) names.push(name);
    }
    return names;
  }

  get sendingRow(): ChainRow | null {
    return this.sending === null
      ? null
      : (this.rows.find((row) => row.key === this.sending) ?? null);
  }

  openSend = (): void => {
    const row = this.selectedDest;
    if (!row) return;
    this.newBus = '';
    this.newBusOpen = false;
    this.sending = row.key;
  };

  closeSend = (): void => {
    this.sending = null;
  };

  showNewBus = (): void => {
    this.newBusOpen = true;
  };

  setNewBus = (event: Event): void => {
    this.newBus = (event.target as HTMLInputElement).value.trim();
  };

  get newBusProblem(): string | null {
    if (this.newBus === '') return null;
    return (
      busNameProblem(this.newBus) ??
      (this.busNames.includes(this.newBus)
        ? `There is already a bus called '${this.newBus}'.`
        : null)
    );
  }

  /** Sends the chosen row somewhere: a bus that exists, or (`create`) a new one, made in the project script. */
  send = async (to: string, create = false): Promise<void> => {
    const row = this.sendingRow;
    this.sending = null;
    const from = row ? this.#sendFrom(row) : null;
    if (!row || !from) return;
    const group = `chain-${++actions}`;
    const scope = this.args.scopeId;
    if (create && scope !== PROJECT_SCOPE) {
      // a bus other tracks can see is the project's: make it there, then send this chain to it
      const project = this.project.doc.script;
      const made = addBus(project, to, this.context);
      if (!(await this.apply(made, { scope: PROJECT_SCOPE, group }))) return;
      await this.apply(sendTo(this.script, { from, to }, this.context), {
        group,
        choose: null,
      });
      this.chosen = { kind: 'dest', id: row.key };
      return;
    }
    await this.apply(sendTo(this.script, { from, to, create }, this.context), {
      group,
      choose: null,
    });
    this.chosen = { kind: 'dest', id: row.key };
  };

  createBus = async (): Promise<void> => {
    if (this.newBus === '' || this.newBusProblem) return;
    await this.send(this.newBus, true);
  };

  // --- modulators -------------------------------------------------------------------------------------------

  get modulatingNode(): ChainNode | null {
    return this.modulating
      ? (this.nodes.get(this.modulating.id) ?? null)
      : null;
  }

  get modulatingParams(): NumberParam[] {
    const node = this.modulatingNode;
    return node ? this.modulatable(node) : [];
  }

  openModulate = (): void => {
    const node = this.selected;
    if (!node) return;
    const first = this.modulatable(node)[0];
    if (first) this.modulating = { id: node.id, param: first.name };
  };

  closeModulate = (): void => {
    this.modulating = null;
  };

  pickParam = (param: string): void => {
    if (this.modulating) this.modulating = { ...this.modulating, param };
  };

  addModulator = async (type: string): Promise<void> => {
    const modulating = this.modulating;
    const node = this.modulatingNode;
    this.modulating = null;
    if (!modulating || !node) return;
    const meta = this.modulatable(node).find(
      (param) => param.name === modulating.param,
    );
    if (!meta) return;
    await this.apply(
      addModulator(
        this.script,
        {
          target: this.refOf(node),
          param: modulating.param,
          type,
          depth: suggestDepth({
            ...meta,
            // (where the parameter is now is what it should swing around)
            default: Math.min(
              meta.max,
              Math.max(
                meta.min,
                this.audio.paramValue(this.args.scopeId, node.id, meta.name) ??
                  meta.default,
              ),
            ),
          }),
        },
        this.context,
      ),
    );
  };

  /** Every parameter a modulator can be pointed at: the nodes of the drawing that are not modulators. */
  get targets(): { node: ChainNode; param: NumberParam }[] {
    const seen = new Set<string>();
    const list: { node: ChainNode; param: NumberParam }[] = [];
    for (const row of this.rows) {
      if (row.kind === 'modulator') continue;
      for (const node of row.nodes) {
        if (seen.has(node.id)) continue;
        seen.add(node.id);
        for (const param of this.modulatable(node)) list.push({ node, param });
      }
    }
    return list;
  }

  openRetarget = (): void => {
    if (this.selected) this.retargeting = this.selected.id;
  };

  closeRetarget = (): void => {
    this.retargeting = null;
  };

  retargetTo = async (node: ChainNode, param: string): Promise<void> => {
    const modulator = this.retargeting
      ? this.nodes.get(this.retargeting)
      : null;
    this.retargeting = null;
    if (!modulator) return;
    await this.apply(
      retarget(
        this.script,
        {
          modulator: this.refOf(modulator),
          target: this.refOf(node),
          param,
        },
        this.context,
      ),
      { choose: modulator.id },
    );
  };

  removeModulator = async (): Promise<void> => {
    const node = this.selected;
    if (!node) return;
    await this.apply(
      removeModulator(this.script, this.refOf(node), this.context),
      { choose: null },
    );
  };

  /** Types the picker offers for the node it is adding next to: a bus's own names are left out. */
  get pickerTypes(): Set<string> | null {
    const node = this.pickingNode;
    const row = node
      ? this.rows.find((candidate) =>
          candidate.nodes.some((n) => n.id === node.id),
        )
      : null;
    return row?.kind === 'bus'
      ? new Set(
          this.audio
            .nodeTypes()
            .map((info) => info.type)
            .filter((type) => !BUS_OWN.has(type)),
        )
      : null;
  }

  label = (node: ChainNode): string => nameOf(node);

  <template>
    {{! template-lint-disable no-invalid-interactive }}
    {{! (keys and taps on empty space clear the choice; every control inside is a button) }}
    <section
      class="signal-chain"
      aria-label="{{@label}} signal chain"
      data-test-pane="chain"
      ...attributes
      {{on "keydown" this.onKeydown}}
      {{on "click" this.onBackground}}
    >
      <Hint
        @label="About the signal chain"
        class="signal-chain__hint"
        data-test-chain-hint
      >
        <p>This is the running script, drawn. Sound flows left to right, from a
          node nothing feeds to the bus it is sent to. A dashed line is a
          modulator moving a parameter.</p>
        <p>Tap a node to choose it: its track is chosen and its controls (or a
          sampler's waveform) show in the footer, and you can add, move or
          remove it. Tap where a chain goes to send it elsewhere, or the
          parameter a modulator moves to move it. Tap empty space, or press
          Escape, to choose nothing.</p>
        <p>Changes are written into the script as if you had typed them, and
          Undo takes them back. A node marked
          <b>edit in script</b>
          is made by code Euclip cannot change from here.</p>
      </Hint>

      {{#if this.hasError}}
        <p class="signal-chain__status" role="status" data-test-chain-error>The
          script has an error. This is the version still running.</p>
      {{/if}}

      {{#each this.rows key="key" as |row|}}
        <div
          class="chain-row"
          data-kind={{row.kind}}
          data-branch={{if row.branch "true"}}
          data-test-chain-row={{row.kind}}
        >
          {{#if row.title}}
            <h4 class="chain-row__title" data-test-row-title>{{row.title}}</h4>
          {{else if row.branch}}
            <h4 class="chain-row__title">branch</h4>
          {{/if}}
          <ol class="chain-row__line">
            {{#each row.nodes key="id" as |node|}}
              <li class="chain-link">
                <button
                  type="button"
                  class="chain-node"
                  aria-pressed={{if (this.isSelected node) "true" "false"}}
                  data-readonly={{if (this.isReadOnly node) "true"}}
                  data-test-chain-node={{node.id}}
                  data-type={{node.type}}
                  {{on "click" (fn this.choose node)}}
                >
                  <b>{{node.type}}</b>
                  {{#unless node.autoId}}<span>{{node.id}}</span>{{/unless}}
                  {{#if (this.isReadOnly node)}}<i>edit in script</i>{{/if}}
                </button>
                <span class="chain-wire" aria-hidden="true"></span>
              </li>
            {{/each}}
            <li class="chain-link chain-link--end">
              {{#if (isParam row)}}
                <span class="chain-wire chain-wire--modulates">
                  <i>modulates</i>
                </span>
              {{/if}}
              {{#if (isParam row)}}
                <button
                  type="button"
                  class="chain-dest"
                  data-kind={{row.destination.kind}}
                  data-test-chain-dest={{row.destination.name}}
                  {{on "click" (fn this.chooseTarget row)}}
                >{{row.destination.name}}</button>
              {{else}}
                <button
                  type="button"
                  class="chain-dest"
                  aria-pressed={{if (this.isDestSelected row) "true" "false"}}
                  data-kind={{row.destination.kind}}
                  data-test-chain-dest={{row.destination.name}}
                  {{on "click" (fn this.chooseDest row)}}
                >{{row.destination.name}}</button>
              {{/if}}
            </li>
          </ol>
        </div>
      {{else}}
        <p class="pane-empty" data-test-pane-empty>This script has made nothing
          to draw yet.</p>
      {{/each}}

      {{#if this.barShown}}
        <div
          class="chain-actions"
          role="toolbar"
          aria-label="What to do with the chosen node"
          data-test-chain-actions
        >
          {{#if this.confirming}}
            <p
              class="chain-actions__what"
              role="alertdialog"
              data-test-chain-confirm
            >{{this.confirmText}}</p>
            <div class="chain-actions__buttons">
              <button
                type="button"
                class="btn btn--s btn--solid"
                data-test-chain-confirm-remove
                {{on "click" this.confirmRemove}}
              >Remove</button>
              <button
                type="button"
                class="btn btn--s btn--on-yellow"
                data-test-chain-confirm-cancel
                {{on "click" this.cancelRemove}}
              >Cancel</button>
            </div>
          {{else if this.selected}}
            <p class="chain-actions__what" data-test-chain-chosen>
              <b>{{this.selected.type}}</b>
              {{#unless this.selected.autoId}}<span
                >{{this.selected.id}}</span>{{/unless}}
            </p>
            <div class="chain-actions__buttons">
              {{#if (is this.selectedKind "modulator")}}
                <button
                  type="button"
                  class="btn btn--s btn--on-yellow"
                  disabled={{this.reasons.remove}}
                  title={{this.reasons.remove}}
                  data-test-chain-action="remove-modulator"
                  {{on "click" this.removeModulator}}
                >Remove</button>
              {{else}}
                <button
                  type="button"
                  class="btn btn--s btn--on-yellow"
                  disabled={{this.reasons.before}}
                  title={{this.reasons.before}}
                  data-test-chain-action="add-before"
                  {{on "click" (fn this.openPicker "before")}}
                >Add before</button>
                <button
                  type="button"
                  class="btn btn--s btn--on-yellow"
                  disabled={{this.reasons.after}}
                  title={{this.reasons.after}}
                  data-test-chain-action="add-after"
                  {{on "click" (fn this.openPicker "after")}}
                >Add after</button>
                <button
                  type="button"
                  class="btn btn--s btn--on-yellow"
                  disabled={{this.reasons.left}}
                  title={{this.reasons.left}}
                  data-test-chain-action="move-left"
                  {{on "click" (fn this.move "left")}}
                >Move left</button>
                <button
                  type="button"
                  class="btn btn--s btn--on-yellow"
                  disabled={{this.reasons.right}}
                  title={{this.reasons.right}}
                  data-test-chain-action="move-right"
                  {{on "click" (fn this.move "right")}}
                >Move right</button>
                <button
                  type="button"
                  class="btn btn--s btn--on-yellow"
                  disabled={{this.reasons.remove}}
                  title={{this.reasons.remove}}
                  data-test-chain-action="remove"
                  {{on "click" this.remove}}
                >Remove</button>
                <button
                  type="button"
                  class="btn btn--s btn--on-yellow"
                  disabled={{this.reasons.modulate}}
                  title={{this.reasons.modulate}}
                  data-test-chain-action="modulate"
                  {{on "click" this.openModulate}}
                >Add modulator</button>
              {{/if}}
            </div>
          {{else if this.selectedDest}}
            <p class="chain-actions__what" data-test-chain-chosen>
              <b>Sent to</b>
              <span>{{this.selectedDest.destination.name}}</span>
            </p>
            <div class="chain-actions__buttons">
              <button
                type="button"
                class="btn btn--s btn--on-yellow"
                disabled={{this.reasons.send}}
                title={{this.reasons.send}}
                data-test-chain-action="send"
                {{on "click" this.openSend}}
              >Send to…</button>
            </div>
          {{/if}}
          {{#if this.reason}}
            <Hint @label="Why some actions are off" data-test-chain-why>
              <p>{{this.reason}}</p>
            </Hint>
          {{/if}}
        </div>
      {{/if}}

      {{#if this.picking}}
        {{! template-lint-disable no-invalid-interactive }}
        <dialog
          class="chain-picker"
          aria-label="Add a node {{this.picking.side}} {{this.pickingNode.type}}"
          data-test-chain-picker
          {{showModal}}
          {{on "close" this.closePicker}}
        >
          <div class="chain-picker__bar">
            <b>Add {{this.picking.side}} {{this.pickingNode.type}}</b>
            <button
              type="button"
              class="btn btn--s btn--quiet"
              data-test-chain-picker-close
              {{on "click" this.closePicker}}
            >Cancel</button>
          </div>
          <input
            type="search"
            class="chain-picker__search"
            placeholder="Search node types"
            aria-label="Search node types"
            value={{this.query}}
            data-test-chain-picker-search
            {{on "input" this.setQuery}}
          />
          <div class="chain-picker__list">
            {{#each this.groups key="title" as |group|}}
              <section data-test-chain-group={{group.title}}>
                <h4>{{group.title}}</h4>
                <ul>
                  {{#each group.types key="type" as |entry|}}
                    <li>
                      <button
                        type="button"
                        class="chain-picker__type"
                        title={{entry.description}}
                        data-test-chain-type={{entry.type}}
                        {{on "click" (fn this.add entry.type)}}
                      >{{entry.type}}</button>
                    </li>
                  {{/each}}
                </ul>
              </section>
            {{else}}
              <p class="pane-empty">No node type matches.</p>
            {{/each}}
          </div>
        </dialog>
      {{/if}}
      {{#if this.sendingRow}}
        {{! template-lint-disable no-invalid-interactive }}
        <dialog
          class="chain-picker"
          aria-label="Send to"
          data-test-chain-send
          {{showModal}}
          {{on "close" this.closeSend}}
        >
          <div class="chain-picker__bar">
            <b>Send to…</b>
            <button
              type="button"
              class="btn btn--s btn--quiet"
              data-test-chain-send-close
              {{on "click" this.closeSend}}
            >Cancel</button>
          </div>
          <div class="chain-picker__list">
            <ul>
              {{#each this.busNames as |name|}}
                <li>
                  <button
                    type="button"
                    class="chain-picker__type"
                    aria-pressed={{if
                      (is name this.sendingRow.destination.name)
                      "true"
                      "false"
                    }}
                    data-test-chain-send-to={{name}}
                    {{on "click" (fn this.send name false)}}
                  >{{name}}{{#if (is name "channel")}}
                      (this track’s strip){{/if}}</button>
                </li>
              {{/each}}
              <li>
                <button
                  type="button"
                  class="chain-picker__type"
                  aria-expanded={{if this.newBusOpen "true" "false"}}
                  data-test-chain-send-new
                  {{on "click" this.showNewBus}}
                >New bus…</button>
              </li>
            </ul>
            {{#if this.newBusOpen}}
              <div class="chain-picker__new">
                <input
                  type="text"
                  class="chain-picker__search"
                  placeholder="Name of the new bus"
                  aria-label="Name of the new bus"
                  value={{this.newBus}}
                  data-test-chain-new-bus
                  {{on "input" this.setNewBus}}
                />
                <button
                  type="button"
                  class="btn btn--s btn--solid"
                  disabled={{if
                    this.newBus
                    (if this.newBusProblem true false)
                    true
                  }}
                  data-test-chain-new-bus-create
                  {{on "click" this.createBus}}
                >Make it and send</button>
              </div>
              <p
                class="chain-picker__problem"
                role="status"
                data-test-chain-new-bus-problem
              >{{this.newBusProblem}}</p>
            {{/if}}
          </div>
        </dialog>
      {{/if}}

      {{#if this.modulatingNode}}
        {{! template-lint-disable no-invalid-interactive }}
        <dialog
          class="chain-picker"
          aria-label="Modulate {{this.modulatingNode.type}}"
          data-test-chain-modulate
          {{showModal}}
          {{on "close" this.closeModulate}}
        >
          <div class="chain-picker__bar">
            <b>Modulate {{this.modulatingNode.type}}</b>
            <button
              type="button"
              class="btn btn--s btn--quiet"
              data-test-chain-modulate-close
              {{on "click" this.closeModulate}}
            >Cancel</button>
          </div>
          <div class="chain-picker__list">
            <h4>Parameter</h4>
            <ul>
              {{#each this.modulatingParams key="name" as |param|}}
                <li>
                  <button
                    type="button"
                    class="chain-picker__type"
                    aria-pressed={{if
                      (is param.name this.modulating.param)
                      "true"
                      "false"
                    }}
                    title={{param.description}}
                    data-test-chain-param={{param.name}}
                    {{on "click" (fn this.pickParam param.name)}}
                  >{{param.name}}</button>
                </li>
              {{/each}}
            </ul>
            <h4>Modulator</h4>
            <ul>
              {{#each this.modulatorTypes as |type|}}
                <li>
                  <button
                    type="button"
                    class="chain-picker__type"
                    data-test-chain-modulator={{type}}
                    {{on "click" (fn this.addModulator type)}}
                  >Add {{type}}</button>
                </li>
              {{/each}}
            </ul>
          </div>
        </dialog>
      {{/if}}

      {{#if this.retargeting}}
        {{! template-lint-disable no-invalid-interactive }}
        <dialog
          class="chain-picker"
          aria-label="Retarget the modulator"
          data-test-chain-retarget
          {{showModal}}
          {{on "close" this.closeRetarget}}
        >
          <div class="chain-picker__bar">
            <b>Move {{this.retargeting}} to…</b>
            <button
              type="button"
              class="btn btn--s btn--quiet"
              data-test-chain-retarget-close
              {{on "click" this.closeRetarget}}
            >Cancel</button>
          </div>
          <div class="chain-picker__list">
            <ul>
              {{#each this.targets as |target|}}
                <li>
                  <button
                    type="button"
                    class="chain-picker__type"
                    data-test-chain-target="{{target.node.id}}.{{target.param.name}}"
                    {{on
                      "click"
                      (fn this.retargetTo target.node target.param.name)
                    }}
                  >{{target.node.id}}.{{target.param.name}}</button>
                </li>
              {{/each}}
            </ul>
          </div>
        </dialog>
      {{/if}}
    </section>
  </template>
}

function is(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  return a === b;
}

function isParam(row: ChainRow): boolean {
  return row.destination.kind === 'param';
}
