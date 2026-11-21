/**
 * Reading a script the way the Signal chain tab needs to edit it.
 *
 * The script is parsed (acorn), never searched with patterns. What is *recognised* is a top-level
 * statement, `__()...;`, `const x = __()...;` or `__.bus('name')...;`, that is a chain of node calls
 * (`.lowpass({...})`, a name from the library's catalog) optionally ending in `.to('bus')`,
 * `.connect(...)` or `.modulate('#id', 'param')`. Anything else (loops, functions, `.split`, a chain
 * built conditionally) is not recognised: the tab still draws what it makes, but cannot edit it.
 *
 * Everything here is positions in the script's text: an edit is a list of ranges to replace, so every
 * other character (comments, blank lines, the person's own formatting) stays as it is.
 */
import * as acorn from 'acorn';

export interface EditContext {
  /** the node types the library offers: a call with one of these names makes a node */
  nodeTypes: ReadonlySet<string>;
  /** types that make sound of their own: a chain starts with one (so nothing is added before it) */
  sourceTypes: ReadonlySet<string>;
  /** types that move a parameter of another node (`lfo`, `stepper`) */
  modulatorTypes?: ReadonlySet<string>;
  /** the parameter a bare argument sets, by type: `.lowpass(800)` sets `frequency` */
  shorthands?: Readonly<Record<string, string>>;
  /** ids the running graph has, besides the ones the script's text shows */
  usedIds?: readonly string[];
}

/** A node of the drawing, as the edit finds it in the script. */
export interface NodeRef {
  /** the node's id (a generated one when the script gave none) */
  id: string;
  type: string;
  /** which un-id'd node of its type it is, counted from 1 in creation order; null when it has an id */
  ordinal: number | null;
  /** how many un-id'd nodes of its type the drawing has (all of them must be in the script's text) */
  siblings?: number;
}

export interface Edit {
  start: number;
  end: number;
  text: string;
}

export interface Cannot {
  cannot: string;
}

export interface N {
  type: string;
  start: number;
  end: number;
}
interface CallExpression extends N {
  callee: N;
  arguments: N[];
  optional?: boolean;
}
interface MemberExpression extends N {
  object: N;
  property: N;
  computed: boolean;
  optional?: boolean;
}
interface Identifier extends N {
  name: string;
}
interface Literal extends N {
  value: unknown;
}
interface ObjectExpression extends N {
  properties: N[];
}
interface Property extends N {
  key: N;
  value: N;
  computed: boolean;
  shorthand: boolean;
}

/** One `.name(...)` of a chain. */
export interface Call {
  name: string;
  /** where the text between the previous call and this one starts (its line break and indent) */
  trivia: number;
  /** the `.` */
  start: number;
  end: number;
  args: N[];
  /** a node call: its name is a node type */
  isNode: boolean;
  /** the id written as a string in the first argument's object; null when there is none */
  id: string | null;
  /** an `id` is there but is not a plain string (or the arguments are not a literal), so the id is not known */
  idUnknown: boolean;
}

export interface Chain {
  /** the whole statement, with its `;` */
  start: number;
  end: number;
  /** the chain's own expression, without the `;` */
  exprEnd: number;
  /**
   * `chain`: `__()...`, `bus`: `__.bus('name')...`, `branch`: `__('#id').to('bus')` or
   * `__('#id').chain().node()....to('bus')`, which adds a connection (and nodes) to a node the
   * statements above made.
   */
  root: 'chain' | 'bus' | 'branch';
  /** for a bus: its name */
  bus: string | null;
  /** for a branch: the id of the node it starts from (which another statement made) */
  from: string | null;
  /** for a branch that has nodes: its `.chain()` call (nodes of a branch go after it) */
  chainCall: Call | null;
  /** where the first node call goes: the end of `__()`, `__.bus('name')` or a branch's `.chain()` (or `__('#id')`) */
  rootEnd: number;
  /** `const x =`: the variable's name */
  declared: string | null;
  calls: Call[];
  /** the node calls, in order (a final `.to`, `.connect` or `.modulate` is not one) */
  nodes: Call[];
  tail: Call | null;
  /** whether it is written over several lines */
  multiline: boolean;
}

export interface Comment {
  start: number;
  end: number;
  text: string;
  line: boolean;
}

export interface Analysis {
  text: string;
  body: N[];
  chains: Chain[];
  comments: Comment[];
  /** every `id: '...'` written as a string anywhere in the script, with how many times */
  ids: Map<string, number>;
  /**
   * Code that is not recognised may make nodes: nodes without an id cannot then be told from its
   * nodes by their order.
   */
  uncertain: boolean;
  /** each recognised chain, by its statement */
  ctx: EditContext;
}

export const CONTROL_DECLARATIONS: ReadonlySet<string> = new Set([
  'slider',
  'knob',
  'toggle',
  'select',
  'controls',
  'waveform',
  'synth',
]);

type Shape = Omit<
  Chain,
  'start' | 'end' | 'exprEnd' | 'declared' | 'multiline'
>;

const TAILS = new Set(['to', 'connect', 'modulate']);

function isCall(node: N | undefined): node is CallExpression {
  return node?.type === 'CallExpression';
}
function isMember(node: N | undefined): node is MemberExpression {
  return node?.type === 'MemberExpression';
}
function isIdentifier(node: N | undefined, name?: string): node is Identifier {
  return (
    node?.type === 'Identifier' &&
    (name === undefined || (node as Identifier).name === name)
  );
}
export function stringOf(node: N | undefined): string | null {
  return node?.type === 'Literal' && typeof (node as Literal).value === 'string'
    ? ((node as Literal).value as string)
    : null;
}

/** The id a node call writes in its first argument, if any. */
function idOf(args: N[]): { id: string | null; unknown: boolean } {
  const first = args[0];
  if (first === undefined) return { id: null, unknown: false };
  if (first.type === 'Literal') return { id: null, unknown: false };
  if (first.type !== 'ObjectExpression') return { id: null, unknown: true };
  let unknown = false;
  for (const property of (first as ObjectExpression).properties) {
    if (property.type !== 'Property') {
      unknown = true; // a spread: it may hold an id
      continue;
    }
    const { key, value, computed } = property as Property;
    const named = computed
      ? null
      : isIdentifier(key)
        ? key.name
        : stringOf(key);
    if (computed) unknown = true;
    if (named !== 'id') continue;
    const id = stringOf(value);
    return id === null ? { id: null, unknown: true } : { id, unknown: false };
  }
  return { id: null, unknown };
}

/** Unwinds `__().a().b()` into its root and calls; null when it is not that shape. */
function unwind(expression: N, text: string, ctx: EditContext): Shape | null {
  const calls: Call[] = [];
  let at: N = expression;
  for (;;) {
    if (!isCall(at)) return null;
    const call: CallExpression = at;
    const callee = call.callee;
    if (isIdentifier(callee, '__')) {
      if (call.arguments.length === 0) {
        return finish(calls, 'chain', null, call.end, ctx);
      }
      // __('#x') selects what exists: only the branch form is read
      const id =
        call.arguments.length === 1
          ? /^#([A-Za-z_][\w-]*)$/.exec(stringOf(call.arguments[0]) ?? '')?.[1]
          : undefined;
      return id === undefined ? null : finishBranch(calls, id, call.end);
    }
    if (
      !isMember(callee) ||
      callee.computed ||
      callee.optional ||
      call.optional
    )
      return null;
    if (!isIdentifier(callee.property)) return null;
    if (isIdentifier(callee.object, '__') && callee.property.name === 'bus') {
      const name = stringOf(call.arguments[0]);
      if (name === null || call.arguments.length !== 1) return null;
      return finish(calls, 'bus', name, call.end, ctx);
    }
    // the `.` is the last non-space before the property
    let dot = callee.property.start - 1;
    while (dot > callee.object.end && /\s/.test(text[dot] ?? '')) dot--;
    // (comments between the dot and the name are not looked for: such a chain is left alone)
    if (text[dot] !== '.') return null;
    const { id, unknown } = idOf(call.arguments);
    calls.unshift({
      name: callee.property.name,
      trivia: callee.object.end,
      start: dot,
      end: call.end,
      args: call.arguments,
      isNode: ctx.nodeTypes.has(callee.property.name),
      id,
      idUnknown: unknown,
    });
    at = callee.object;
  }
}

function finish(
  calls: Call[],
  root: 'chain' | 'bus',
  bus: string | null,
  rootEnd: number,
  ctx: EditContext,
): Shape | null {
  const last = calls[calls.length - 1];
  const tail = last && TAILS.has(last.name) && !last.isNode ? last : null;
  const nodes = tail ? calls.slice(0, -1) : calls;
  // every call before the tail must be a node; a tail is one of to / connect / modulate
  if (!nodes.every((call) => call.isNode)) return null;
  void ctx;
  return {
    root,
    bus,
    from: null,
    chainCall: null,
    rootEnd,
    calls,
    nodes,
    tail,
  };
}

/** `__('#id')` then, optionally, `.chain()` and node calls, then `.to('bus')`. */
function finishBranch(
  calls: Call[],
  from: string,
  selectorEnd: number,
): Shape | null {
  const tail = calls[calls.length - 1];
  if (
    !tail ||
    tail.name !== 'to' ||
    tail.isNode ||
    tail.args.length !== 1 ||
    stringOf(tail.args[0]) === null
  ) {
    return null;
  }
  let nodes = calls.slice(0, -1);
  const first = nodes[0];
  const chainCall =
    first && first.name === 'chain' && !first.isNode && first.args.length === 0
      ? first
      : null;
  if (chainCall) nodes = nodes.slice(1);
  // nodes are made through `.chain()` (a node call on a selection only sets), and it makes nothing alone
  if (!nodes.every((call) => call.isNode) || nodes.length > 0 !== !!chainCall) {
    return null;
  }
  return {
    root: 'branch',
    bus: null,
    from,
    chainCall,
    rootEnd: chainCall ? chainCall.end : selectorEnd,
    calls,
    nodes,
    tail,
  };
}

function isCreator(node: unknown, ctx: EditContext): boolean {
  if (!node || typeof node !== 'object') return false;
  const n = node as N;
  if (isCall(n)) {
    if (isIdentifier(n.callee, '__') && n.arguments.length === 0) return true;
    if (
      isMember(n.callee) &&
      isIdentifier(n.callee.property) &&
      (ctx.nodeTypes.has(n.callee.property.name) ||
        n.callee.property.name === 'chain' ||
        n.callee.property.name === 'split')
    ) {
      // (a setter on a selection, `__('#level').gain(0.5)`, makes nothing)
      let base: N = n.callee.object;
      while (isCall(base) || isMember(base)) {
        if (isCall(base) && isIdentifier(base.callee, '__')) {
          return base.arguments.length === 0;
        }
        base = isCall(base) ? base.callee : base.object;
      }
      return true;
    }
  }
  return false;
}

function walk(node: unknown, visit: (node: N) => boolean | void): void {
  if (Array.isArray(node)) {
    for (const item of node) walk(item, visit);
    return;
  }
  if (!node || typeof node !== 'object') return;
  const n = node as N;
  if (typeof n.type !== 'string') return;
  if (visit(n) === false) return;
  for (const value of Object.values(n)) {
    if (value && typeof value === 'object') walk(value, visit);
  }
}

export function analyze(text: string, ctx: EditContext): Analysis | Cannot {
  const comments: Comment[] = [];
  let program: acorn.Program;
  try {
    program = acorn.parse(text, {
      ecmaVersion: 'latest',
      sourceType: 'script',
      allowReturnOutsideFunction: true,
      allowAwaitOutsideFunction: true,
      onComment: (block, content, start, end) =>
        comments.push({ start, end, text: content, line: !block }),
    });
  } catch {
    return {
      cannot: 'The script has a syntax error, so Euclip cannot edit it here.',
    };
  }
  const body = program.body as unknown as N[];
  const chains: Chain[] = [];
  let uncertain = false;
  for (const statement of body) {
    let expression: N | null = null;
    let declared: string | null = null;
    if (statement.type === 'ExpressionStatement') {
      expression = (statement as unknown as { expression: N }).expression;
    } else if (statement.type === 'VariableDeclaration') {
      const declarations = (
        statement as unknown as {
          declarations: { id: N; init: N | null }[];
        }
      ).declarations;
      const only = declarations.length === 1 ? declarations[0] : undefined;
      if (only?.init && isIdentifier(only.id)) {
        expression = only.init;
        declared = only.id.name;
      }
    }
    const shape = expression ? unwind(expression, text, ctx) : null;
    if (expression && shape) {
      chains.push({
        ...shape,
        start: statement.start,
        end: statement.end,
        exprEnd: expression.end,
        declared,
        multiline: text.slice(statement.start, statement.end).includes('\n'),
      });
      for (const node of shape.nodes) if (node.idUnknown) uncertain = true;
    } else {
      let found = false;
      walk(statement, (node) => {
        if (isCreator(node, ctx)) found = true;
        return !found;
      });
      if (found) uncertain = true;
    }
  }
  const ids = new Map<string, number>();
  walk(program, (node) => {
    if (node.type !== 'Property') return;
    const { key, value, computed } = node as Property;
    const name = computed ? null : isIdentifier(key) ? key.name : stringOf(key);
    const id = name === 'id' ? stringOf(value) : null;
    if (id !== null) ids.set(id, (ids.get(id) ?? 0) + 1);
  });
  return { text, body, chains, comments, ids, uncertain, ctx };
}

export function isAnalysis(value: Analysis | Cannot): value is Analysis {
  return !('cannot' in value);
}

/** Where a node of the drawing is in the script: the chain and the index among its node calls. */
export interface Place {
  chain: Chain;
  /** index in `chain.nodes` */
  index: number;
}

export function find(analysis: Analysis, ref: NodeRef): Place | Cannot {
  const here = (condition: (call: Call) => boolean): Place[] =>
    analysis.chains.flatMap((chain) =>
      chain.nodes.flatMap((call, index) =>
        condition(call) ? [{ chain, index }] : [],
      ),
    );
  if (ref.ordinal === null) {
    const found = here((call) => call.id === ref.id);
    if ((analysis.ids.get(ref.id) ?? 0) > 1) {
      return {
        cannot: `The id '${ref.id}' is written more than once in the script, so it is not clear which is this node.`,
      };
    }
    const place = found[0];
    if (!place || found.length !== 1) {
      return {
        cannot: `'${ref.id}' is made by code Euclip cannot edit here (a loop, a function or an unusual chain). Edit it in the script.`,
      };
    }
    if (place.chain.nodes[place.index]!.name !== ref.type) {
      return { cannot: `'${ref.id}' is not a ${ref.type} in the script.` };
    }
    return place;
  }
  if (analysis.uncertain) {
    return {
      cannot:
        'The script has code Euclip cannot read that may make nodes, and this node has no id, so its place in the script is not certain. Give it an id in the script, or edit it there.',
    };
  }
  const plain = here(
    (call) => call.name === ref.type && call.id === null && !call.idUnknown,
  );
  if (ref.siblings !== undefined && ref.siblings !== plain.length) {
    return {
      cannot:
        'The nodes drawn and the script’s calls do not match up (not every node of this type is written in a chain Euclip can read). Edit it in the script.',
    };
  }
  const place = plain[ref.ordinal - 1];
  return place ?? { cannot: 'This node is not found in the script.' };
}

/** A branch statement as the drawing knows it: where it starts, where it ends, its first own node, its order among twins. */
export interface BranchRef {
  /** the id of the node it starts from */
  from: string;
  /** the bus it ends at */
  to: string;
  /** the first node the statement makes, null when it makes none */
  first: NodeRef | null;
  /** among branches with the same start and end that make no node: which, from 0 */
  twin: number;
}

/** The branch statement a drawn branch row is, not the statement of the node it starts from. */
export function findBranch(analysis: Analysis, ref: BranchRef): Chain | Cannot {
  if (ref.first) {
    const place = find(analysis, ref.first);
    if (isCannot(place)) return place;
    if (place.chain.root === 'branch' && place.chain.from === ref.from) {
      return place.chain;
    }
    return {
      cannot: `This branch is not written as __('#${ref.from}').chain()...to('bus'), so it is changed in the script.`,
    };
  }
  const bare = analysis.chains.filter(
    (chain) =>
      chain.root === 'branch' &&
      chain.from === ref.from &&
      chain.nodes.length === 0 &&
      stringOf(chain.tail?.args[0]) === ref.to,
  );
  return (
    bare[ref.twin] ?? {
      cannot: `The branch from '${ref.from}' to '${ref.to}' is made by code Euclip cannot edit here. Edit it in the script.`,
    }
  );
}

export function isCannot<T extends object>(value: T | Cannot): value is Cannot {
  return 'cannot' in value;
}

// --- text helpers ---------------------------------------------------------------------------------

/** Applies edits (each a range of the original text) to a script. They must not overlap. */
export function applyEdits(text: string, edits: readonly Edit[]): string {
  const sorted = [...edits].sort((a, b) => b.start - a.start || b.end - a.end);
  let result = text;
  for (const edit of sorted) {
    result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
  }
  return result;
}

export function lineStart(text: string, at: number): number {
  return text.lastIndexOf('\n', at - 1) + 1;
}

export function lineEnd(text: string, at: number): number {
  const next = text.indexOf('\n', at);
  return next === -1 ? text.length : next;
}

/**
 * The range of a whole statement's lines, when nothing else is on them (the line break after it too),
 * and one blank line more when removing it would leave two together.
 */
export function wholeLines(text: string, start: number, end: number): Edit {
  const from = lineStart(text, start);
  const to = lineEnd(text, end);
  const before = text.slice(from, start);
  const after = text.slice(end, to);
  if (before.trim() !== '' || after.trim() !== '') {
    return { start, end, text: '' };
  }
  let stop = Math.min(to + 1, text.length);
  const previousBlank =
    from === 0 || text.slice(lineStart(text, from - 1), from - 1).trim() === '';
  const nextBlank =
    stop >= text.length || text.slice(stop, lineEnd(text, stop)).trim() === '';
  if (previousBlank && nextBlank && stop < text.length) {
    stop = Math.min(lineEnd(text, stop) + 1, text.length);
  }
  return { start: from, end: stop, text: '' };
}

/** The first statement's text of an argument list, as written, for rewriting a call's argument. */
export function sliceOf(text: string, node: N): string {
  return text.slice(node.start, node.end);
}
