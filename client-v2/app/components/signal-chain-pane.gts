import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import { modifier } from 'ember-modifier';
import Icon, { type IconName } from 'client-v2/components/icon';
import Hint from 'client-v2/components/ui/hint';
import type { TOC } from '@ember/component/template-only';
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
  addChain,
  branchFrom,
  planBranch,
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
  planRemoveBranch,
  planSend,
  removeBranch,
  removeModulator,
  removeNode,
  retarget,
  sendTo,
  suggestDepth,
  type BranchRef,
  type EditContext,
  type EditResult,
  type NodeRef,
  type RemovePlan,
} from 'client-v2/script-edit/edit';
import type { Analysis, Cannot } from 'client-v2/script-edit/analyze';
import type AudioService from 'client-v2/services/audio';
import type ProjectService from 'client-v2/services/project';
import type ViewService from 'client-v2/services/view';
import type ChainMetersService from 'client-v2/services/chain-meters';

export interface SignalChainPaneSignature {
  Element: HTMLElement;
  Args: {
    /** a track's id, or the project scope */
    scopeId: string;
    /** the track's name, for accessible names */
    label: string;
    /** a node was chosen: the track it is in is chosen too (so the footer shows it) */
    onSelectTrack?: (scopeId: string) => void;
    /** this row's track is the selected one: its toolbar is shown */
    selected?: boolean;
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
  kind: 'node' | 'dest' | 'link';
  id: string;
  /**
   * For a node: where it was chosen, `rowKey:index`. A node can be drawn in two rows (a branch starts
   * from one), and what can be done with it depends on which, so a choice is a place, not an id.
   */
  at?: string;
}

type Reasons = Record<
  | 'before'
  | 'after'
  | 'insert'
  | 'left'
  | 'right'
  | 'remove'
  | 'modulate'
  | 'chain'
  | 'route',
  string | null
>;

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

/**
 * Says on a scrolling line which of its ends has more beyond it (`data-more`: start, end, both, none),
 * which the style turns into a fade at that edge.
 */
const scrollFade = modifier((line: HTMLElement) => {
  const update = (): void => {
    const start = line.scrollLeft > 1;
    const end = line.scrollLeft + line.clientWidth < line.scrollWidth - 1;
    line.dataset['more'] =
      start && end ? 'both' : start ? 'start' : end ? 'end' : 'none';
  };
  update();
  line.addEventListener('scroll', update, { passive: true });
  const watch =
    typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
  watch?.observe(line);
  for (const child of line.children) watch?.observe(child);
  return () => {
    line.removeEventListener('scroll', update);
    watch?.disconnect();
  };
});

/**
 * When the action bar appears, its row is scrolled so the bar is whole and clear of the footer.
 * On the phone the bar is a column down the right edge (see signal-chain.css) that scrolls inside
 * itself: it is given the height there is between where it starts and the sheet over the bottom.
 */
const showAboveFooter = modifier((bar: HTMLElement, [chosen]: [string]) => {
  void chosen; // (read, so that it runs again when the choice changes)
  const list = bar.closest<HTMLElement>('.track-list');
  if (bar.closest('[data-phone="true"]')) {
    if (!list || !bar.parentElement) return;
    const fit = (): void => {
      const start =
        bar.parentElement!.getBoundingClientRect().top -
        list.getBoundingClientRect().top +
        list.scrollTop;
      const room = parseFloat(getComputedStyle(list).paddingBlockEnd) || 0;
      const height = Math.floor(list.clientHeight - room - start - 4);
      bar.style.setProperty('--chain-bar-max', `${Math.max(height, 0)}px`);
    };
    fit();
    const watch =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fit);
    watch?.observe(list);
    return () => watch?.disconnect();
  }
  const footer = document.querySelector('.track-footer');
  if (!footer || !list) return;
  const over =
    bar.getBoundingClientRect().bottom - footer.getBoundingClientRect().top;
  if (over > 0) list.scrollBy({ top: over + 8 });
  const under =
    list.getBoundingClientRect().top - bar.getBoundingClientRect().top;
  if (under > 0) list.scrollBy({ top: -under - 8 });
});

/** How long a finger must stay on an icon of the phone's toolbar for its name to show. */
const HOLD_MS = 400;

/**
 * Touch has no hover: pressing and holding an icon of the phone's toolbar shows its name in a small
 * label beside it (laid over the page, since the toolbar scrolls and would clip it), until the finger
 * lifts. The press that showed the name does nothing else: the action is not done.
 */
const holdForLabel = modifier((button: HTMLElement, [label]: [string]) => {
  if (!button.closest('[data-phone="true"]')) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let tip: HTMLElement | null = null;
  let shown = false;
  const hide = (): void => {
    clearTimeout(timer);
    tip?.remove();
    tip = null;
  };
  const show = (): void => {
    shown = true;
    tip = document.createElement('div');
    tip.className = 'chain-tip';
    tip.setAttribute('role', 'presentation');
    tip.textContent = label;
    document.body.append(tip);
    const at = button.getBoundingClientRect();
    tip.style.insetBlockStart = `${Math.round(at.top + at.height / 2)}px`;
    tip.style.insetInlineEnd = `${Math.round(window.innerWidth - at.left + 6)}px`;
  };
  const down = (): void => {
    shown = false;
    clearTimeout(timer);
    timer = setTimeout(show, HOLD_MS);
  };
  const up = (): void => {
    clearTimeout(timer);
    // (the label stays a moment after the finger lifts, long enough to read)
    if (tip) {
      const gone = tip;
      tip = null;
      setTimeout(() => gone.remove(), 900);
    }
  };
  const click = (event: Event): void => {
    if (!shown) return;
    shown = false;
    event.stopImmediatePropagation();
    event.preventDefault();
  };
  const menu = (event: Event): void => event.preventDefault();
  button.addEventListener('pointerdown', down);
  button.addEventListener('pointerup', up);
  button.addEventListener('pointercancel', up);
  button.addEventListener('pointerleave', up);
  button.addEventListener('click', click, true);
  button.addEventListener('contextmenu', menu);
  return () => {
    hide();
    button.removeEventListener('pointerdown', down);
    button.removeEventListener('pointerup', up);
    button.removeEventListener('pointercancel', up);
    button.removeEventListener('pointerleave', up);
    button.removeEventListener('click', click, true);
    button.removeEventListener('contextmenu', menu);
  };
});

interface ToolSignature {
  Args: {
    icon: IconName;
    label: string;
    /** why it cannot be done now; null when it can */
    reason: string | null;
    /** the test hook and kind of action */
    action: string;
    onClick: () => void;
  };
}

/**
 * One action of the toolbar: an icon, named for assistive tech always (`aria-label`), named in a small
 * tooltip on hover and on keyboard focus (`data-label`, drawn by the style), and named in words under
 * the icon on touch screens, which have no hover. On the phone (a column of icons only) the name shows
 * while the icon is pressed and held (`holdForLabel`).
 */
const Tool: TOC<ToolSignature> = <template>
  <button
    type="button"
    class="chain-tool"
    disabled={{@reason}}
    aria-label={{@label}}
    data-label={{@label}}
    data-test-chain-action={{@action}}
    {{holdForLabel @label}}
    {{on "click" @onClick}}
  >
    <Icon @name={{@icon}} />
    <span class="chain-tool__label" aria-hidden="true">{{@label}}</span>
  </button>
</template>;

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
  @service('chain-meters') declare meters: ChainMetersService;

  @tracked chosen: Chosen | null = null;

  /** What is chosen, while this row's track is the selected one. */
  get current(): Chosen | null {
    return this.args.selected ? this.chosen : null;
  }
  /** the picker is open: where the new node goes */
  @tracked picking:
    | {
        side: 'before' | 'after';
        id: string;
        /** the node is a branch's start, drawn again: the new node goes into the branch's statement */
        branch?: BranchRef;
      }
    | { chain: true }
    | null = null;
  @tracked query = '';
  /** removing needs a word first: what it would take with it */
  @tracked confirming: {
    id: string;
    plan: RemovePlan;
    /** removing a whole branch: which, and how many nodes it makes */
    branch?: { ref: BranchRef; nodes: number };
  } | null = null;
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

  /** The statement of a branch row: how the script tells it from the statement of the node it starts from. */
  branchOf = (row: ChainRow): BranchRef | null => {
    const start = row.nodes[row.shared - 1];
    if (row.kind !== 'chain' || row.shared === 0 || !start) return null;
    const own = row.nodes[row.shared];
    return {
      from: start.id,
      to: row.destination.name,
      first: own ? this.refOf(own) : null,
      twin: row.twin,
    };
  };

  /** Where the chosen node is drawn: its row and its place in it (a branch row draws its start again). */
  get place(): { row: ChainRow; index: number } | null {
    const current = this.current;
    if (current?.kind !== 'node') return null;
    if (current.at) {
      const colon = current.at.lastIndexOf(':');
      const row = this.rows.find((r) => r.key === current.at!.slice(0, colon));
      const index = Number(current.at.slice(colon + 1));
      if (row && row.nodes[index]?.id === current.id) return { row, index };
    }
    let any: { row: ChainRow; index: number } | null = null;
    for (const row of this.rows) {
      const index = row.nodes.findIndex((n) => n.id === current.id);
      if (index < 0) continue;
      if (index >= row.shared) return { row, index };
      any ??= { row, index };
    }
    return any;
  }

  /** The chosen node is drawn again in a branch row, from the row it branched from: it is not the branch's own. */
  get isReference(): boolean {
    const place = this.place;
    return place !== null && place.index < place.row.shared;
  }

  /** The branch a choice is the start of: its drawn-again start node, or the one connection it has when it makes no node. */
  get branchRemoval(): { row: ChainRow; ref: BranchRef } | null {
    const place = this.place;
    const link = this.selectedLink;
    const row =
      place && place.index === place.row.shared - 1
        ? place.row
        : link &&
            link.index === link.row.shared - 1 &&
            link.row.nodes.length === link.row.shared
          ? link.row
          : null;
    const ref = row ? this.branchOf(row) : null;
    return row && ref ? { row, ref } : null;
  }

  get selected(): ChainNode | null {
    return this.current?.kind === 'node'
      ? (this.nodes.get(this.current.id) ?? null)
      : null;
  }

  /** The row whose end chip is chosen, if one is. */
  get selectedDest(): ChainRow | null {
    return this.current?.kind === 'dest'
      ? (this.rows.find((row) => row.key === this.current?.id) ?? null)
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

  isSelected = (node: ChainNode, row: ChainRow, index: number): boolean => {
    const place = this.place;
    return (
      this.current?.id === node.id &&
      place?.row.key === row.key &&
      place.index === index
    );
  };

  /** A branch row's first nodes are the main chain's, drawn again. */
  isRef = (row: ChainRow, index: number): boolean => index < row.shared;

  isDestSelected = (row: ChainRow): boolean =>
    this.current?.kind === 'dest' && this.current.id === row.key;

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

  /** The connection chosen, if one is: the link after a node of a row (the last one leads to the row's end). */
  get selectedLink(): {
    row: ChainRow;
    index: number;
    from: ChainNode;
    to: ChainNode | null;
  } | null {
    const current = this.current;
    if (current?.kind !== 'link') return null;
    const at = current.id.lastIndexOf(':');
    const row = this.rows.find(
      (candidate) => candidate.key === current.id.slice(0, at),
    );
    const from = row?.nodes[Number(current.id.slice(at + 1))];
    if (!row || !from) return null;
    return {
      row,
      index: Number(current.id.slice(at + 1)),
      from,
      to: row.nodes[Number(current.id.slice(at + 1)) + 1] ?? null,
    };
  }

  linkKey = (row: ChainRow, index: number): string => `${row.key}:${index}`;

  isLinkSelected = (row: ChainRow, index: number): boolean =>
    this.current?.kind === 'link' &&
    this.current.id === this.linkKey(row, index);

  linkName = (row: ChainRow, index: number): string => {
    const from = row.nodes[index];
    const to = row.nodes[index + 1];
    return `Connection from ${from ? nameOf(from) : ''} to ${to ? nameOf(to) : row.destination.name}`;
  };

  /** The modulator row the choice is in (a node of one, or a link of one), if any. */
  get modulatorRow(): ChainRow | null {
    const link = this.selectedLink;
    if (link) return link.row.kind === 'modulator' ? link.row : null;
    return this.selectedKind === 'modulator'
      ? (this.rows.find((row) =>
          row.nodes.some((n) => n.id === this.selected?.id),
        ) ?? null)
      : null;
  }

  /** The node an action works from: the chosen node, or the one before the chosen connection. */
  get anchor(): ChainNode | null {
    return this.selected ?? this.selectedLink?.from ?? null;
  }

  /** The short name of what is chosen, for the toolbar's fixed cell. */
  get chosenName(): string {
    const link = this.selectedLink;
    if (link)
      return `${nameOf(link.from)} → ${link.to ? nameOf(link.to) : link.row.destination.name}`;
    const node = this.selected;
    if (node) {
      // (the type once, unless the id says more than the type does)
      return node.autoId || node.id === node.type
        ? node.type
        : `${node.type} · ${node.id}`;
    }
    const dest = this.selectedDest;
    if (dest) return `to ${dest.destination.name}`;
    return 'nothing chosen';
  }

  /** What the "route" slot does for what is chosen. */
  get routeKind(): 'send' | 'branch' | 'retarget' | null {
    if (this.selectedDest) return 'send';
    if (this.modulatorRow) return 'retarget';
    const link = this.selectedLink;
    if (link) return link.to ? 'branch' : 'send';
    return this.selected ? 'branch' : null;
  }

  /** What each action would say if it cannot be done, for what is chosen (null: it can). */
  get reasons(): Reasons {
    const check = (result: EditResult | Cannot | null): string | null =>
      result && 'cannot' in result ? result.cannot : null;
    const context = this.context;
    const text = this.script;
    const nothing = 'Choose a node or a connection first.';
    const all = (why: string | null): Reasons => ({
      before: why,
      after: why,
      insert: why,
      left: why,
      right: why,
      remove: why,
      modulate: why,
      chain: null,
      route: why,
    });
    const errored = this.hasError
      ? 'The script has an error. Fix it, or undo, before editing here.'
      : null;
    const analysis = this.analysis;
    const chainWhy = errored ?? (isAnalysis(analysis) ? null : analysis.cannot);
    const none = { ...all(nothing), chain: chainWhy };
    const dest = this.selectedDest;
    if (dest)
      return {
        ...all('This is where the chain goes: tap it to send it elsewhere.'),
        chain: chainWhy,
        route: this.sendWhy(dest),
      };
    const anchor = this.anchor;
    if (!anchor) return none;
    const why = this.whyNot(anchor);
    if (why !== null) return { ...all(why), chain: chainWhy, route: why };
    const ref = this.refOf(anchor);
    const modulator = this.modulatorRow;
    if (modulator) {
      const plan = check(
        planModulator(text, this.refOf(modulator.nodes[0]!), context),
      );
      return {
        ...all('A modulator is moved or removed, not chained.'),
        chain: chainWhy,
        remove: plan,
        route: plan,
      };
    }
    const link = this.selectedLink;
    const type = [...context.nodeTypes][0] ?? 'gain';
    const place = this.place;
    const removal = this.branchRemoval;
    const planned = removal
      ? planRemoveBranch(text, removal.ref, context)
      : null;
    const removeBranchWhy =
      planned && 'cannot' in planned ? planned.cannot : null;
    const modulatable =
      this.modulatable(anchor).length === 0
        ? anchor.macro
          ? 'This is a macro: the library lets only some of a macro’s parameters be modulated, so do it in the script.'
          : 'This node has no parameter the library can modulate (audio-rate numbers only).'
        : this.modulatorTypes.length === 0
          ? 'The library has no modulator to add.'
          : null;
    const branch = check(planBranch(text, ref, context));
    if (link) {
      return {
        ...all('Choose a node to do this.'),
        chain: chainWhy,
        insert: check(
          addNode(
            text,
            {
              at: ref,
              side: 'after',
              type,
              ...(link.row.shared > 0 && link.index === link.row.shared - 1
                ? { branch: this.branchOf(link.row) ?? undefined }
                : {}),
            },
            context,
          ),
        ),
        remove: removal
          ? removeBranchWhy
          : 'Choose a node to remove it, or the start of a branch to remove the branch.',
        route: link.to ? branch : this.sendWhy(link.row),
      };
    }
    if (place && this.isReference) {
      const main =
        'This node is the main chain’s, drawn again where the branch starts: change it in the chain it belongs to.';
      const start = place.index === place.row.shared - 1;
      const own = start ? this.branchOf(place.row) : null;
      return {
        ...all(null),
        chain: chainWhy,
        before: main,
        after: own
          ? check(
              addNode(
                text,
                { at: ref, side: 'after', type, branch: own },
                context,
              ),
            )
          : main,
        insert: 'Choose a connection to insert a node into it.',
        left: main,
        right: main,
        remove: removal ? removeBranchWhy : main,
        modulate: modulatable,
        route: branch,
      };
    }
    return {
      ...all(null),
      chain: chainWhy,
      before: check(addNode(text, { at: ref, side: 'before', type }, context)),
      insert: 'Choose a connection to insert a node into it.',
      left: check(moveNode(text, { node: ref, direction: 'left' }, context)),
      right: check(moveNode(text, { node: ref, direction: 'right' }, context)),
      modulate: modulatable,
      route: branch,
    };
  }

  /** One sentence for the chosen item: what the last action could not do, or why an action is off (behind the "?"). */
  get reason(): string | null {
    if (this.problem) return this.problem;
    const reasons = this.reasons;
    // what is chosen decides which comes first: where it goes, then what it is
    const order = [
      'route',
      'remove',
      'modulate',
      'before',
      'left',
      'right',
      'after',
      'insert',
      'chain',
    ] as const;
    const given = order
      .map((key) => reasons[key])
      .filter((why): why is string => why !== null);
    return given.find((why) => !/^Choose a /.test(why)) ?? given[0] ?? null;
  }

  get routeLabel(): string {
    return this.routeKind === 'send'
      ? 'Send to…'
      : this.routeKind === 'branch'
        ? 'Branch to…'
        : this.routeKind === 'retarget'
          ? 'Retarget'
          : 'Reroute';
  }

  get routeIcon(): IconName {
    return this.routeKind === 'retarget' ? 'retarget' : 'reroute';
  }

  get removeAction(): string {
    return this.modulatorRow
      ? 'remove-modulator'
      : this.branchRemoval
        ? 'remove-branch'
        : 'remove';
  }

  /** Every icon of the toolbar with its name and, if it is off, why: the phone's "?" lists them. */
  get legend(): { icon: IconName; label: string; reason: string | null }[] {
    const reasons = this.reasons;
    return [
      { icon: 'addBefore', label: 'Add before', reason: reasons.before },
      { icon: 'addAfter', label: 'Add after', reason: reasons.after },
      { icon: 'insertHere', label: 'Insert node here', reason: reasons.insert },
      { icon: 'moveLeft', label: 'Move left', reason: reasons.left },
      { icon: 'moveRight', label: 'Move right', reason: reasons.right },
      { icon: 'removeNode', label: this.removeLabel, reason: reasons.remove },
      { icon: 'modulate', label: 'Add modulator', reason: reasons.modulate },
      { icon: 'addChain', label: 'Add chain', reason: reasons.chain },
      { icon: this.routeIcon, label: this.routeLabel, reason: reasons.route },
    ];
  }

  get removeLabel(): string {
    return this.modulatorRow
      ? 'Remove modulator'
      : this.branchRemoval
        ? 'Remove branch'
        : 'Remove';
  }

  /** The toolbar is part of the selected track's row in Signal view, whatever is or is not chosen. */
  get barShown(): boolean {
    return this.args.selected === true;
  }

  /** A tap on a node chooses it, chooses its track, and shows it in the footer at once. */
  choose = (node: ChainNode, row: ChainRow, index: number): void => {
    this.chosen = { kind: 'node', id: node.id, at: `${row.key}:${index}` };
    this.confirming = null;
    this.problem = null;
    this.args.onSelectTrack?.(this.args.scopeId);
    this.open(node);
  };

  /** A tap on a connection chooses it: insert a node into it, or route from it. */
  chooseLink = (row: ChainRow, index: number): void => {
    this.chosen = { kind: 'link', id: this.linkKey(row, index) };
    this.confirming = null;
    this.problem = null;
    this.args.onSelectTrack?.(this.args.scopeId);
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
      // (the list was last used for a branch, perhaps: a tap on a chip sends)
      this.sendMode = 'send';
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
    // a source that has an editor (a sampler's waveform, an oscillator's or synth macro's synth) opens it
    const source = this.audio
      .sources(this.args.scopeId)
      .find((candidate) => candidate.nodeId === node.id);
    if (source || node.type === 'sampler') {
      this.view.showSourceOf(this.args.scopeId, source?.key ?? null);
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
    const place = this.place;
    const branch =
      place && this.isReference && place.index === place.row.shared - 1
        ? this.branchOf(place.row)
        : null;
    this.picking = {
      side,
      id: this.selected.id,
      ...(branch ? { branch } : {}),
    };
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
    return this.picking && 'id' in this.picking
      ? (this.nodes.get(this.picking.id) ?? null)
      : null;
  }

  /** Where the picker adds: next to a node, or (a new chain) its source. */
  get pickingTitle(): string {
    const picking = this.picking;
    if (!picking) return '';
    if ('chain' in picking) return 'Add a chain: choose its source';
    return `Add ${picking.side} ${this.pickingNode?.type ?? ''}`;
  }

  openChainPicker = (): void => {
    this.query = '';
    this.picking = { chain: true };
  };

  /** Between two nodes: after the first of them. */
  insertHere = (): void => {
    const link = this.selectedLink;
    if (!link) return;
    this.query = '';
    const branch =
      link.row.shared > 0 && link.index === link.row.shared - 1
        ? this.branchOf(link.row)
        : null;
    this.picking = {
      side: 'after',
      id: link.from.id,
      ...(branch ? { branch } : {}),
    };
  };

  add = async (type: string): Promise<void> => {
    const picking = this.picking;
    const node = this.pickingNode;
    this.picking = null;
    if (picking && 'chain' in picking) {
      await this.apply(
        addChain(
          this.script,
          {
            type,
            to: this.args.scopeId === PROJECT_SCOPE ? 'main' : 'channel',
          },
          this.context,
        ),
      );
      return;
    }
    if (!picking || !node || !('side' in picking)) return;
    await this.apply(
      addNode(
        this.script,
        {
          at: this.refOf(node),
          side: picking.side,
          type,
          ...(picking.branch ? { branch: picking.branch } : {}),
        },
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
    if (plan.wholeStatement || plan.modulators > 0 || plan.branches > 0) {
      this.confirming = { id: node.id, plan };
      return;
    }
    await this.#removeNow(node);
  };

  confirmRemove = async (): Promise<void> => {
    const confirming = this.confirming;
    this.confirming = null;
    if (confirming?.branch) {
      await this.apply(
        removeBranch(this.script, confirming.branch.ref, this.context),
        { choose: null },
      );
      return;
    }
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
    if (confirming.branch) {
      const { nodes } = confirming.branch;
      const parts = [
        nodes === 0
          ? 'This removes the branch: the extra connection from the node.'
          : `This removes the branch, and the ${nodes === 1 ? 'node' : `${nodes} nodes`} it makes with ${nodes === 1 ? 'its' : 'their'} controls.`,
      ];
      if (confirming.plan.modulators > 0)
        parts.push('What moves those nodes goes too.');
      parts.push('The main chain is not touched. Undo brings it all back.');
      return parts.join(' ');
    }
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
    if (confirming.plan.branches > 0) {
      parts.push(
        confirming.plan.branches === 1
          ? 'The branch that starts from it goes too.'
          : `The ${confirming.plan.branches} branches that start from it go too.`,
      );
    }
    parts.push('Undo brings it all back.');
    return parts.join(' ');
  }

  // --- destinations ---------------------------------------------------------------------------------------

  /** The script a row's end is written in, and what it says to change: the row's last node, or the bus. */
  #sendFrom = (
    row: ChainRow,
  ): { node: NodeRef } | { bus: string } | { branch: BranchRef } | null => {
    if (row.kind === 'bus') return row.bus === null ? null : { bus: row.bus };
    const last = row.nodes[row.nodes.length - 1];
    if (row.kind !== 'chain' || !last) return null;
    // a branch that makes no node of its own is told from the statement of the node it starts from
    const branch = row.nodes.length === row.shared ? this.branchOf(row) : null;
    return branch ? { branch } : { node: this.refOf(last) };
  };

  sendWhy = (row: ChainRow): string | null => {
    if (this.hasError) {
      return 'The script has an error. Fix it, or undo, before editing here.';
    }
    if (row.destination.kind === 'output') {
      return 'This bus is the last stop: main goes to the speakers.';
    }
    if (row.branch && (row.kind !== 'chain' || row.shared === 0)) {
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

  /** What the list of buses is for: sending a chain's end somewhere, or branching from a node. */
  @tracked sendMode: 'send' | 'branch' = 'send';
  #branchFrom: string | null = null;

  /** The route slot: send the chain's end, branch from a node, or retarget a modulator, by what is chosen. */
  route = (): void => {
    this.newBus = '';
    this.newBusOpen = false;
    this.problem = null;
    const kind = this.routeKind;
    if (kind === 'retarget') {
      const modulator = this.modulatorRow?.nodes[0];
      if (modulator) this.retargeting = modulator.id;
    } else if (kind === 'send') {
      const row = this.selectedDest ?? this.selectedLink?.row;
      if (!row) return;
      this.sendMode = 'send';
      this.sending = row.key;
    } else if (kind === 'branch') {
      const anchor = this.anchor;
      const row = anchor
        ? this.rows.find((candidate) =>
            candidate.nodes.some((n) => n.id === anchor.id),
          )
        : null;
      if (!anchor || !row) return;
      this.sendMode = 'branch';
      this.#branchFrom = anchor.id;
      this.sending = row.key;
    }
  };

  /** Remove, for what is chosen: a node, or a whole modulator. */
  removeChosen = async (): Promise<void> => {
    if (this.modulatorRow) await this.removeModulator();
    else if (this.branchRemoval) this.removeWholeBranch();
    else await this.remove();
  };

  /** Removing a branch asks first: it takes the nodes only it made. */
  removeWholeBranch = (): void => {
    const removal = this.branchRemoval;
    if (!removal) return;
    const plan = planRemoveBranch(this.script, removal.ref, this.context);
    if ('cannot' in plan) {
      this.problem = plan.cannot;
      return;
    }
    this.confirming = {
      id: removal.ref.from,
      plan: {
        wholeStatement: false,
        modulators: plan.modulators,
        branches: 0,
      },
      branch: { ref: removal.ref, nodes: plan.nodes },
    };
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
    const group = `chain-${++actions}`;
    const scope = this.args.scopeId;
    if (this.sendMode === 'branch') {
      const node = this.#branchFrom
        ? this.nodes.get(this.#branchFrom)
        : undefined;
      if (!node) return;
      let script = this.script;
      if (create) {
        const made = addBus(
          scope === PROJECT_SCOPE ? script : this.project.doc.script,
          to,
          this.context,
        );
        if ('cannot' in made) {
          this.problem = made.cannot;
          return;
        }
        if (scope === PROJECT_SCOPE) script = made.script;
        else if (!(await this.apply(made, { scope: PROJECT_SCOPE, group })))
          return;
      }
      await this.apply(
        branchFrom(script, { node: this.refOf(node), to }, this.context),
        {
          group,
          choose: node.id,
        },
      );
      return;
    }
    const from = row ? this.#sendFrom(row) : null;
    if (!row || !from) return;
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
    const node = this.modulatorRow?.nodes[0];
    if (!node) return;
    await this.apply(
      removeModulator(this.script, this.refOf(node), this.context),
      { choose: null },
    );
  };

  /** Types the picker offers for the node it is adding next to: a bus's own names are left out. */
  get pickerTypes(): Set<string> | null {
    if (this.picking && 'chain' in this.picking)
      return this.context.sourceTypes as Set<string>;
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

  /** What the drawing is made of: when it changes, the meters look for their elements again. */
  get signature(): string {
    return this.rows
      .map((row) => `${row.kind}:${row.nodes.map((node) => node.id).join(',')}`)
      .join('|');
  }

  /** Levels are shown on this picture while it is on screen (services/chain-meters.ts). */
  meter = modifier(
    (element: HTMLElement, [scopeId, signature]: [string, string]) => {
      void signature; // (read, so that a change of drawing runs this again)
      return this.meters.register(element, scopeId);
    },
  );

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
      {{this.meter @scopeId this.signature}}
    >

      <div class="signal-chain__body">
        {{#if this.barShown}}
          {{#if this.view.phone}}
            <p
              class="chain-chosen"
              data-test-chain-chosen
            >{{this.chosenName}}</p>
          {{/if}}
        {{/if}}
        {{#if this.hasError}}
          <p
            class="signal-chain__status"
            role="status"
            data-test-chain-error
          >The script has an error. This is the version still running.</p>
        {{/if}}

        {{#each this.rows key="key" as |row|}}
          <div
            class="chain-row"
            data-kind={{row.kind}}
            data-branch={{if row.branch "true"}}
            data-test-chain-row={{row.kind}}
          >
            {{#if row.title}}
              <h4
                class="chain-row__title"
                data-test-row-title
              >{{row.title}}</h4>
            {{else if row.branch}}
              <h4 class="chain-row__title">branch</h4>
            {{/if}}
            <ol class="chain-row__line" {{scrollFade}}>
              {{#each row.nodes key="id" as |node index|}}
                <li
                  class="chain-link"
                  data-meter={{node.id}}
                  data-control={{if (is row.kind "modulator") "true"}}
                >
                  <button
                    type="button"
                    class="chain-node"
                    aria-pressed={{if
                      (this.isSelected node row index)
                      "true"
                      "false"
                    }}
                    data-readonly={{if (this.isReadOnly node) "true"}}
                    data-ref={{if (this.isRef row index) "true"}}
                    data-test-chain-node={{node.id}}
                    data-type={{node.type}}
                    {{on "click" (fn this.choose node row index)}}
                  >
                    <b>{{node.type}}</b>
                    {{#unless node.autoId}}<span>{{node.id}}</span>{{/unless}}
                    {{#if (this.isRef row index)}}<i>main chain</i>
                    {{else if (this.isReadOnly node)}}<i>edit in script</i>{{/if}}
                  </button>
                  <span class="chain-wire">
                    <button
                      type="button"
                      class="chain-hit"
                      aria-label={{this.linkName row index}}
                      aria-pressed={{if
                        (this.isLinkSelected row index)
                        "true"
                        "false"
                      }}
                      data-test-chain-link="{{row.key}}:{{index}}"
                      {{on "click" (fn this.chooseLink row index)}}
                    ></button>
                  </span>
                </li>
              {{/each}}
              <li
                class="chain-link chain-link--end"
                data-meter-in={{lastId row}}
              >
                {{#if (isParam row)}}
                  <span class="chain-wire chain-wire--modulates">
                    <i>modulates</i>
                    <button
                      type="button"
                      class="chain-hit"
                      aria-label={{this.linkName row row.nodes.length}}
                      aria-pressed={{if
                        (this.isLinkSelected row row.nodes.length)
                        "true"
                        "false"
                      }}
                      data-test-chain-link="{{row.key}}:{{row.nodes.length}}"
                      {{on "click" (fn this.chooseLink row row.nodes.length)}}
                    ></button>
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
          <p class="pane-empty" data-test-pane-empty>This script has made
            nothing to draw yet.</p>
        {{/each}}
      </div>

      {{#if this.barShown}}
        <div
          class="chain-actions"
          role="toolbar"
          {{showAboveFooter this.chosenName}}
          aria-label="What to do with the chain"
          data-test-chain-actions
        >
          {{#unless this.view.phone}}
            <p
              class="chain-actions__what"
              data-test-chain-chosen
            >{{this.chosenName}}</p>
          {{/unless}}
          <Tool
            @icon="addBefore"
            @label="Add before"
            @reason={{this.reasons.before}}
            @action="add-before"
            @onClick={{fn this.openPicker "before"}}
          />
          <Tool
            @icon="addAfter"
            @label="Add after"
            @reason={{this.reasons.after}}
            @action="add-after"
            @onClick={{fn this.openPicker "after"}}
          />
          <Tool
            @icon="insertHere"
            @label="Insert node here"
            @reason={{this.reasons.insert}}
            @action="insert"
            @onClick={{this.insertHere}}
          />
          <Tool
            @icon="moveLeft"
            @label="Move left"
            @reason={{this.reasons.left}}
            @action="move-left"
            @onClick={{fn this.move "left"}}
          />
          <Tool
            @icon="moveRight"
            @label="Move right"
            @reason={{this.reasons.right}}
            @action="move-right"
            @onClick={{fn this.move "right"}}
          />
          <Tool
            @icon="removeNode"
            @label={{this.removeLabel}}
            @reason={{this.reasons.remove}}
            @action={{this.removeAction}}
            @onClick={{this.removeChosen}}
          />
          <Tool
            @icon="modulate"
            @label="Add modulator"
            @reason={{this.reasons.modulate}}
            @action="modulate"
            @onClick={{this.openModulate}}
          />
          <Tool
            @icon="addChain"
            @label="Add chain"
            @reason={{this.reasons.chain}}
            @action="add-chain"
            @onClick={{this.openChainPicker}}
          />
          <Tool
            @icon={{this.routeIcon}}
            @label={{this.routeLabel}}
            @reason={{this.reasons.route}}
            @action="route"
            @onClick={{this.route}}
          />
          <Hint @label="About the signal chain" data-test-chain-why>
            {{#if this.view.phone}}
              <ul class="chain-legend" data-test-chain-legend>
                {{#each this.legend as |tool|}}
                  <li>
                    <Icon @name={{tool.icon}} />
                    <span><b>{{tool.label}}</b>{{#if tool.reason}}
                        {{tool.reason}}{{/if}}</span>
                  </li>
                {{/each}}
              </ul>
            {{/if}}
            <p>This is the running script, drawn. Sound flows left to right,
              from a node nothing feeds to the bus it is sent to. A dashed line
              is a modulator moving a parameter.</p>
            <p>Tap a node to choose it: its track is chosen and its controls (or
              a sampler's waveform) show in the footer, and you can add, move or
              remove it. Tap where a chain goes to send it elsewhere, or the
              parameter a modulator moves to move it. Tap empty space, or press
              Escape, to choose nothing.</p>
            <p>Changes are written into the script as if you had typed them, and
              Undo takes them back. A node marked
              <b>edit in script</b>
              is made by code Euclip cannot change from here.</p>
            {{#if this.reason}}
              <p><b>Why something is off:</b>
                <span data-test-chain-reason>{{this.reason}}</span></p>
            {{/if}}
          </Hint>
        </div>
      {{/if}}

      {{#if this.confirming}}
        {{! template-lint-disable no-invalid-interactive }}
        <dialog
          class="chain-picker"
          role="alertdialog"
          aria-label="Remove"
          data-test-chain-confirm
          {{showModal}}
          {{on "close" this.cancelRemove}}
        >
          <p>{{this.confirmText}}</p>
          <div class="chain-picker__bar">
            <button
              type="button"
              class="btn btn--s btn--solid"
              data-test-chain-confirm-remove
              {{on "click" this.confirmRemove}}
            >Remove</button>
            <button
              type="button"
              class="btn btn--s btn--quiet"
              data-test-chain-confirm-cancel
              {{on "click" this.cancelRemove}}
            >Cancel</button>
          </div>
        </dialog>
      {{/if}}

      {{#if this.picking}}
        {{! template-lint-disable no-invalid-interactive }}
        <dialog
          class="chain-picker"
          aria-label={{this.pickingTitle}}
          data-test-chain-picker
          {{showModal}}
          {{on "close" this.closePicker}}
        >
          <div class="chain-picker__bar">
            <b>{{this.pickingTitle}}</b>
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
            <b>{{if (is this.sendMode "branch") "Branch to…" "Send to…"}}</b>
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

function lastId(row: ChainRow): string | undefined {
  return row.nodes[row.nodes.length - 1]?.id;
}

function isParam(row: ChainRow): boolean {
  return row.destination.kind === 'param';
}
