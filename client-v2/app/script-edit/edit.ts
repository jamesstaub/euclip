/**
 * Edits to a script's text for the Signal chain tab, as pure functions: `(script, action) => new script`
 * or `{ cannot: reason }`. Each is what a person would type, made from a template: the generated code
 * always has an id (made unique in the script), one node call to a line with two spaces of indent as in
 * the templates, and every other character of the script is left as it was.
 *
 * Where the script is in a shape these cannot find the place in (see `analyze.ts`), the answer is
 * `{ cannot }` with the reason in words, which the tab shows beside the disabled action.
 */
import {
  CONTROL_DECLARATIONS,
  analyze,
  applyEdits,
  find,
  isAnalysis,
  isCannot,
  lineStart,
  stringOf,
  wholeLines,
  type Analysis,
  type Call,
  type Cannot,
  type Chain,
  type Edit,
  type EditContext,
  type N,
  type NodeRef,
  type Place,
} from 'client-v2/script-edit/analyze';

export type { Cannot, EditContext, NodeRef };
export {
  analyze,
  find,
  isAnalysis,
  isCannot,
} from 'client-v2/script-edit/analyze';

export interface Edited {
  script: string;
  /** the id a node was given or made */
  id?: string;
}
export type EditResult = Edited | Cannot;

const INDENT = '  ';

/** A bus has these of its own: `bus.gain` is its level, so an insert of those types is `insert().gain()`. */
const BUS_OWN = new Set([
  'gain',
  'input',
  'to',
  'chain',
  'insert',
  'inserts',
  'output',
  'name',
  'scope',
]);

function busRefusal(type: string): Cannot {
  return {
    cannot: `On a bus, '${type}' is the bus's own (its level, its input): write that insert in the script as .insert().${type}().`,
  };
}

function quote(text: string): string {
  return `'${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/** A name unused by any id in the script, and by the nodes now running: `lowpass`, `lowpass_2`, ... */
export function uniqueId(
  analysis: Analysis,
  base: string,
  taken: readonly string[] = [],
): string {
  const used = new Set<string>([
    ...analysis.ids.keys(),
    ...(analysis.ctx.usedIds ?? []),
    ...taken,
  ]);
  if (!used.has(base)) return base;
  for (let n = 2; ; n++) if (!used.has(`${base}_${n}`)) return `${base}_${n}`;
}

function open(script: string, ctx: EditContext): Analysis | Cannot {
  return analyze(script, ctx);
}

// --- where a new call goes --------------------------------------------------------------------------

/** The break and indent a chain puts between its calls, to be used for one more. */
function separatorAt(
  analysis: Analysis,
  chain: Chain,
  call: Call | undefined,
): string {
  const text = analysis.text;
  const own = (c: Call | undefined): string | null => {
    if (!c) return null;
    const trivia = text.slice(c.trivia, c.start);
    const match = /\n([ \t]*)$/.exec(trivia);
    return match ? `\n${match[1]}` : trivia.includes('\n') ? `\n${INDENT}` : '';
  };
  return (
    own(call) ??
    own(
      chain.calls.find((c) => text.slice(c.trivia, c.start).includes('\n')),
    ) ??
    (chain.multiline ? `\n${INDENT}` : '')
  );
}

// --- ids ------------------------------------------------------------------------------------------

/** The edit that writes an id into a node call's arguments. */
export function writeId(
  analysis: Analysis,
  call: Call,
  id: string,
): Edit | Cannot {
  const text = analysis.text;
  const first = call.args[0];
  if (!first) {
    return {
      start: call.end - 1,
      end: call.end - 1,
      text: `{ id: ${quote(id)} }`,
    };
  }
  if (first.type === 'ObjectExpression') {
    const properties = (first as unknown as { properties: N[] }).properties;
    if (properties.length === 0) {
      return {
        start: first.start,
        end: first.end,
        text: `{ id: ${quote(id)} }`,
      };
    }
    const after = text.slice(first.start + 1);
    if (/^[ \t]*\n/.test(after)) {
      const indent = /\n([ \t]*)/.exec(after)?.[1] ?? INDENT;
      return {
        start: first.start + 1,
        end: first.start + 1,
        text: `\n${indent}id: ${quote(id)},`,
      };
    }
    return {
      start: first.start + 1,
      end: first.start + 1,
      text: ` id: ${quote(id)},`,
    };
  }
  if (first.type === 'Literal') {
    const param = analysis.ctx.shorthands?.[call.name];
    if (!param) {
      return {
        cannot: `.${call.name}() has no shorthand argument Euclip knows how to turn into options.`,
      };
    }
    return {
      start: first.start,
      end: first.end,
      text: `{ id: ${quote(id)}, ${param}: ${text.slice(first.start, first.end)} }`,
    };
  }
  return {
    cannot:
      'This call’s options are not written out, so an id cannot be added to them.',
  };
}

// --- the Controls section -----------------------------------------------------------------------------

const CONTROLS_HEADER = /^\s*Controls\b/i;

/** The edit that adds a line at the end of the script's `// Controls` section, or of the script. */
export function appendControls(analysis: Analysis, line: string): Edit {
  const text = analysis.text;
  const header = analysis.comments.find(
    (comment) =>
      comment.line &&
      CONTROLS_HEADER.test(comment.text) &&
      text.slice(lineStart(text, comment.start), comment.start).trim() === '',
  );
  if (!header) {
    return text.endsWith('\n') || text === ''
      ? { start: text.length, end: text.length, text: `${line}\n` }
      : { start: text.length, end: text.length, text: `\n${line}` };
  }
  // the section runs to the next comment that heads one (at the start of a line, after a blank line)
  const next = analysis.comments.find(
    (comment) =>
      comment.line &&
      comment.start > header.end &&
      text.slice(lineStart(text, comment.start), comment.start) === '' &&
      (lineStart(text, comment.start) === 0 ||
        text
          .slice(
            lineStart(text, lineStart(text, comment.start) - 1),
            lineStart(text, comment.start) - 1,
          )
          .trim() === ''),
  );
  const limit = next ? next.start : text.length;
  const inside = analysis.body.filter(
    (statement) => statement.start > header.end && statement.start < limit,
  );
  const last = inside[inside.length - 1];
  const at = last ? last.end : header.end;
  return { start: at, end: at, text: `\n${line}` };
}

/** The edits that delete control declarations whose first argument is exactly `'#id'`. */
export function removeControlsOf(
  analysis: Analysis,
  ids: readonly string[],
): Edit[] {
  const edits: Edit[] = [];
  const selectors = new Set(ids.map((id) => `#${id}`));
  for (const statement of analysis.body) {
    if (statement.type !== 'ExpressionStatement') continue;
    const call = (statement as unknown as { expression: N })
      .expression as unknown as {
      type: string;
      callee: N & { name?: string };
      arguments: N[];
    };
    if (
      call.type !== 'CallExpression' ||
      call.callee.type !== 'Identifier' ||
      !CONTROL_DECLARATIONS.has(call.callee.name ?? '')
    ) {
      continue;
    }
    const selector = stringOf(call.arguments[0]);
    if (selector !== null && selectors.has(selector)) {
      edits.push(wholeLines(analysis.text, statement.start, statement.end));
    }
  }
  return edits;
}

function controlsLine(id: string): string {
  return `controls(${quote(`#${id}`)});`;
}

// --- add ------------------------------------------------------------------------------------------

export interface AddAction {
  at: NodeRef;
  side: 'before' | 'after';
  type: string;
}

export function addNode(
  script: string,
  action: AddAction,
  ctx: EditContext,
): EditResult {
  const analysis = open(script, ctx);
  if (!isAnalysis(analysis)) return analysis;
  if (!ctx.nodeTypes.has(action.type)) {
    return { cannot: `'${action.type}' is not a node type the library has.` };
  }
  const place = find(analysis, action.at);
  if (isCannot(place)) return place;
  const { chain, index } = place;
  const call = chain.nodes[index]!;
  if (chain.root === 'bus' && BUS_OWN.has(action.type))
    return busRefusal(action.type);
  if (
    action.side === 'before' &&
    index === 0 &&
    chain.root === 'chain' &&
    ctx.sourceTypes.has(call.name)
  ) {
    return {
      cannot: 'A chain starts with its source: nothing is added before it.',
    };
  }
  const id = uniqueId(analysis, action.type);
  const segment = `.${action.type}({ id: ${quote(id)} })`;
  const next =
    action.side === 'after'
      ? (chain.nodes[index + 1] ?? chain.tail ?? undefined)
      : call;
  const separator = separatorAt(analysis, chain, next ?? call);
  const position =
    action.side === 'after'
      ? call.end
      : index === 0
        ? chain.rootEnd
        : chain.nodes[index - 1]!.end;
  return {
    script: applyEdits(script, [
      { start: position, end: position, text: separator + segment },
      appendControls(analysis, controlsLine(id)),
    ]),
    id,
  };
}

/** Adds a first insert to a bus that has none written: `__.bus('name').type({ id })`. */
export function addBusInsert(
  script: string,
  action: { bus: string; type: string },
  ctx: EditContext,
): EditResult {
  const analysis = open(script, ctx);
  if (!isAnalysis(analysis)) return analysis;
  if (!ctx.nodeTypes.has(action.type)) {
    return { cannot: `'${action.type}' is not a node type the library has.` };
  }
  if (BUS_OWN.has(action.type)) return busRefusal(action.type);
  const id = uniqueId(analysis, action.type);
  const segment = `.${action.type}({ id: ${quote(id)} })`;
  const chain = [...analysis.chains]
    .reverse()
    .find(
      (candidate) => candidate.root === 'bus' && candidate.bus === action.bus,
    );
  const edits: Edit[] = [appendControls(analysis, controlsLine(id))];
  if (chain) {
    const at =
      chain.nodes.length > 0
        ? chain.nodes[chain.nodes.length - 1]!.end
        : chain.rootEnd;
    edits.push({
      start: at,
      end: at,
      text:
        separatorAt(
          analysis,
          chain,
          chain.nodes[chain.nodes.length - 1] ?? chain.calls[0],
        ) + segment,
    });
  } else {
    // no statement for this bus yet: a new one after the last chain statement, or at the top
    const last = analysis.chains[analysis.chains.length - 1];
    const statement = `__.bus(${quote(action.bus)})\n${INDENT}${segment};`;
    edits.push(
      last
        ? { start: last.end, end: last.end, text: `\n${statement}` }
        : { start: 0, end: 0, text: `${statement}\n` },
    );
  }
  return { script: applyEdits(script, edits), id };
}

// --- remove ---------------------------------------------------------------------------------------

export interface RemovePlan {
  /** removing it removes the whole statement (a chain of one node, or a chain's source) */
  wholeStatement: boolean;
  /** modulator statements that move this node, removed with it */
  modulators: number;
}

function modulatorsOf(analysis: Analysis, id: string): Chain[] {
  return analysis.chains.filter(
    (chain) =>
      chain.root === 'chain' &&
      chain.tail?.name === 'modulate' &&
      stringOf(chain.tail.args[0]) === `#${id}`,
  );
}

function wholeStatementFor(analysis: Analysis, place: Place): boolean {
  const { chain, index } = place;
  if (chain.root === 'bus') return false; // the bus stays: `__.bus('main')`
  return (
    chain.nodes.length === 1 ||
    (index === 0 && analysis.ctx.sourceTypes.has(chain.nodes[0]!.name))
  );
}

export function planRemove(
  script: string,
  node: NodeRef,
  ctx: EditContext,
): RemovePlan | Cannot {
  const analysis = open(script, ctx);
  if (!isAnalysis(analysis)) return analysis;
  const place = find(analysis, node);
  if (isCannot(place)) return place;
  return {
    wholeStatement: wholeStatementFor(analysis, place),
    modulators: modulatorsOf(analysis, node.id).length,
  };
}

/** The edit that takes one call out of its chain, and the comments' lines it leaves alone. */
function removeCall(analysis: Analysis, chain: Chain, call: Call): Edit {
  const text = analysis.text;
  const trivia = text.slice(call.trivia, call.start);
  if (!/\/[/*]/.test(trivia)) {
    return { start: call.trivia, end: call.end, text: '' };
  }
  // a comment sits before it: keep that and take the line the call is on
  const start = lineStart(text, call.start);
  let end = call.end;
  const rest = /^[ \t]*\n[ \t]*(?=\.)/.exec(text.slice(end));
  if (rest && text.slice(start, call.start).trim() === '')
    end += rest[0].indexOf('\n') + 1;
  void chain;
  return { start, end, text: '' };
}

export function removeNode(
  script: string,
  node: NodeRef,
  ctx: EditContext,
): EditResult {
  const analysis = open(script, ctx);
  if (!isAnalysis(analysis)) return analysis;
  const place = find(analysis, node);
  if (isCannot(place)) return place;
  const { chain, index } = place;
  const call = chain.nodes[index]!;
  const removed: string[] = [];
  const edits: Edit[] = [];
  const dependants = modulatorsOf(analysis, node.id);
  const collect = (target: Chain): void => {
    for (const each of target.nodes)
      if (each.id !== null) removed.push(each.id);
  };
  if (call.id !== null && !removed.includes(call.id)) removed.push(call.id);
  if (wholeStatementFor(analysis, place)) {
    collect(chain);
    edits.push(wholeLines(analysis.text, chain.start, chain.end));
  } else {
    edits.push(removeCall(analysis, chain, call));
  }
  for (const modulator of dependants) {
    if (modulator === chain) continue;
    collect(modulator);
    edits.push(wholeLines(analysis.text, modulator.start, modulator.end));
  }
  edits.push(...removeControlsOf(analysis, removed));
  return { script: applyEdits(script, dedupe(edits)) };
}

function dedupe(edits: Edit[]): Edit[] {
  const seen = new Set<string>();
  return edits.filter((edit) => {
    const key = `${edit.start}:${edit.end}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// --- move -----------------------------------------------------------------------------------------

export function moveNode(
  script: string,
  action: { node: NodeRef; direction: 'left' | 'right' },
  ctx: EditContext,
): EditResult {
  const analysis = open(script, ctx);
  if (!isAnalysis(analysis)) return analysis;
  const place = find(analysis, action.node);
  if (isCannot(place)) return place;
  const { chain, index } = place;
  const other = index + (action.direction === 'left' ? -1 : 1);
  const a = chain.nodes[Math.min(index, other)];
  const b = chain.nodes[Math.max(index, other)];
  if (!a || !b || other < 0) {
    return {
      cannot: `It is already the ${action.direction === 'left' ? 'first' : 'last'} node of its chain.`,
    };
  }
  if (
    chain.root === 'chain' &&
    Math.min(index, other) === 0 &&
    ctx.sourceTypes.has(chain.nodes[0]!.name)
  ) {
    return { cannot: 'A chain starts with its source: it stays first.' };
  }
  const text = analysis.text;
  const swapped =
    text.slice(b.start, b.end) +
    text.slice(a.end, b.start) +
    text.slice(a.start, a.end);
  return {
    script: applyEdits(script, [{ start: a.start, end: b.end, text: swapped }]),
  };
}

// --- ids for nodes that have none ---------------------------------------------------------------------

/** Gives a node an id in its call (for an action that needs to name it). The result says what it is. */
export function giveId(
  script: string,
  node: NodeRef,
  ctx: EditContext,
): EditResult {
  const analysis = open(script, ctx);
  if (!isAnalysis(analysis)) return analysis;
  const place = find(analysis, node);
  if (isCannot(place)) return place;
  const call = place.chain.nodes[place.index]!;
  if (call.id !== null) return { script, id: call.id };
  const id = uniqueId(analysis, node.type);
  const edit = writeId(analysis, call, id);
  if (isCannot(edit)) return edit;
  return { script: applyEdits(script, [edit]), id };
}

// --- destinations -------------------------------------------------------------------------------------

/** A name a bus can have: letters, digits, underscore and hyphen, starting with a letter. */
export function busNameProblem(name: string): string | null {
  if (name.length === 0) return 'Give the bus a name.';
  if (name.length > 32) return 'A bus name is at most 32 characters.';
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(name)) {
    return 'A bus name starts with a letter and has only letters, digits, _ and -.';
  }
  if (name === 'main' || name === 'channel') {
    return `'${name}' is a bus Euclip already has.`;
  }
  return null;
}

/** Where a chain's last node, or a bus, is sent: the `.to('...')` of its statement. */
export type SendFrom = { node: NodeRef } | { bus: string };

function sendPlace(
  analysis: Analysis,
  from: SendFrom,
): { chain: Chain } | Cannot {
  if ('bus' in from) {
    const chain = [...analysis.chains]
      .reverse()
      .find(
        (candidate) => candidate.root === 'bus' && candidate.bus === from.bus,
      );
    if (!chain) {
      return {
        cannot: `The script has no statement for the bus '${from.bus}' to put a .to() on.`,
      };
    }
    if (chain.tail?.name !== 'to') {
      return {
        cannot: `The bus '${from.bus}' has no .to('...') in the script: it goes to main. Add one in the script to route it.`,
      };
    }
    return { chain };
  }
  const place = find(analysis, from.node);
  if (isCannot(place)) return place;
  const { chain, index } = place;
  if (index !== chain.nodes.length - 1) {
    return {
      cannot:
        'This node is not the end of its chain, so it is not what is sent anywhere.',
    };
  }
  if (chain.tail && chain.tail.name !== 'to') {
    return {
      cannot: `This chain ends in .${chain.tail.name}(...), not in a bus: change that in the script.`,
    };
  }
  return { chain };
}

/** Why a destination cannot be changed, or null. */
export function planSend(
  script: string,
  from: SendFrom,
  ctx: EditContext,
): Cannot | null {
  const analysis = open(script, ctx);
  if (!isAnalysis(analysis)) return analysis;
  const place = sendPlace(analysis, from);
  if (isCannot(place)) return place;
  const arg = place.chain.tail?.args[0];
  if (place.chain.tail && (!arg || stringOf(arg) === null)) {
    return {
      cannot:
        'Its .to(...) names the bus with something other than a plain string.',
    };
  }
  return null;
}

/**
 * Rewrites the `.to('...')` of a chain (or a bus), or appends one to a chain that has none. With
 * `create`, a statement `__.bus('name');` is made first, just before the statement (for a bus that is
 * to be made in this script).
 */
export function sendTo(
  script: string,
  action: { from: SendFrom; to: string; create?: boolean },
  ctx: EditContext,
): EditResult {
  const analysis = open(script, ctx);
  if (!isAnalysis(analysis)) return analysis;
  const refused = planSend(script, action.from, ctx);
  if (refused) return refused;
  const place = sendPlace(analysis, action.from) as { chain: Chain };
  const { chain } = place;
  const edits: Edit[] = [];
  const tail = chain.tail;
  if (tail) {
    const arg = tail.args[0]!;
    edits.push({ start: arg.start, end: arg.end, text: quote(action.to) });
  } else {
    const last = chain.calls[chain.calls.length - 1];
    edits.push({
      start: chain.exprEnd,
      end: chain.exprEnd,
      text: `${separatorAt(analysis, chain, last)}.to(${quote(action.to)})`,
    });
  }
  if (action.create) {
    const at = lineStart(analysis.text, chain.start);
    edits.push({ start: at, end: at, text: `__.bus(${quote(action.to)});\n` });
  }
  return { script: applyEdits(script, edits) };
}

/** Makes a bus in a script: `__.bus('name');` after its last chain or bus statement. */
export function addBus(
  script: string,
  name: string,
  ctx: EditContext,
): EditResult {
  const problem = busNameProblem(name);
  if (problem) return { cannot: problem };
  const analysis = open(script, ctx);
  if (!isAnalysis(analysis)) return analysis;
  const exists = analysis.chains.some(
    (chain) => chain.root === 'bus' && chain.bus === name,
  );
  if (exists) return { script };
  const statement = `__.bus(${quote(name)});`;
  const last = analysis.chains.filter((chain) => chain.root === 'bus').pop();
  if (last) {
    return {
      script: applyEdits(script, [
        { start: last.end, end: last.end, text: `\n${statement}` },
      ]),
    };
  }
  const first = analysis.body[0];
  const at = first ? lineStart(script, first.start) : 0;
  return {
    script: applyEdits(script, [
      { start: at, end: at, text: `${statement}\n` },
    ]),
  };
}

// --- modulators ---------------------------------------------------------------------------------------

/** A depth that moves a parameter a sensible way, from what the library says of its range. */
export function suggestDepth(meta: {
  min: number;
  max: number;
  default: number;
  curve: string;
}): number {
  const range = meta.max - meta.min;
  let depth =
    meta.curve === 'log' || meta.curve === 'exp'
      ? Math.abs(meta.default) * 0.5
      : range * 0.25;
  if (!Number.isFinite(depth) || depth <= 0)
    depth = range > 0 ? range * 0.25 : 1;
  depth = Math.min(depth, range > 0 ? range : depth);
  const digits = 2 - Math.floor(Math.log10(depth)) - 1;
  const factor = 10 ** Math.max(0, digits);
  return Math.round(depth * factor) / factor;
}

export interface AddModulatorAction {
  target: NodeRef;
  param: string;
  /** `lfo`, or another modulator type */
  type: string;
  depth: number;
}

/**
 * `__().lfo({ id: 'lfo', frequency: 2, depth: 300 }).modulate('#filter', 'frequency');` after the chain
 * statements, and `controls('#lfo');` in the Controls section. A target with no id is given one.
 */
export function addModulator(
  script: string,
  action: AddModulatorAction,
  ctx: EditContext,
): EditResult {
  const analysis = open(script, ctx);
  if (!isAnalysis(analysis)) return analysis;
  if (!ctx.modulatorTypes?.has(action.type)) {
    return { cannot: `'${action.type}' is not a modulator the library has.` };
  }
  const place = find(analysis, action.target);
  if (isCannot(place)) return place;
  const call = place.chain.nodes[place.index]!;
  const edits: Edit[] = [];
  let targetId = call.id;
  const taken: string[] = [];
  if (targetId === null) {
    targetId = uniqueId(analysis, action.target.type);
    taken.push(targetId);
    const written = writeId(analysis, call, targetId);
    if (isCannot(written)) return written;
    edits.push(written);
  }
  const id = uniqueId(analysis, action.type, taken);
  const options =
    action.type === 'lfo'
      ? `{ id: ${quote(id)}, frequency: 2, depth: ${action.depth} }`
      : `{ id: ${quote(id)}, depth: ${action.depth} }`;
  const line = `__().${action.type}(${options}).modulate(${quote(`#${targetId}`)}, ${quote(action.param)});`;
  const lastChain = analysis.chains[analysis.chains.length - 1]!;
  const after = Math.max(lastChain.end, place.chain.end);
  edits.push(
    { start: after, end: after, text: `\n${line}` },
    appendControls(analysis, controlsLine(id)),
  );
  return { script: applyEdits(script, edits), id };
}

function modulatorChain(
  analysis: Analysis,
  modulator: NodeRef,
): { chain: Chain; index: number } | Cannot {
  const place = find(analysis, modulator);
  if (isCannot(place)) return place;
  const { chain } = place;
  const tail = chain.tail;
  if (
    chain.root !== 'chain' ||
    tail?.name !== 'modulate' ||
    stringOf(tail.args[0]) === null ||
    stringOf(tail.args[1]) === null
  ) {
    return {
      cannot:
        "This modulator is not written as __().lfo(...).modulate('#id', 'param'), so it is changed in the script.",
    };
  }
  return { chain, index: place.index };
}

/** Why a modulator cannot be retargeted or removed from here, or null. */
export function planModulator(
  script: string,
  modulator: NodeRef,
  ctx: EditContext,
): Cannot | null {
  const analysis = open(script, ctx);
  if (!isAnalysis(analysis)) return analysis;
  const found = modulatorChain(analysis, modulator);
  return isCannot(found) ? found : null;
}

/** Points a modulator at another parameter: the two arguments of its `.modulate(...)`. */
export function retarget(
  script: string,
  action: { modulator: NodeRef; target: NodeRef; param: string },
  ctx: EditContext,
): EditResult {
  const analysis = open(script, ctx);
  if (!isAnalysis(analysis)) return analysis;
  const found = modulatorChain(analysis, action.modulator);
  if (isCannot(found)) return found;
  const place = find(analysis, action.target);
  if (isCannot(place)) return place;
  const call = place.chain.nodes[place.index]!;
  const edits: Edit[] = [];
  let targetId = call.id;
  if (targetId === null) {
    targetId = uniqueId(analysis, action.target.type);
    const written = writeId(analysis, call, targetId);
    if (isCannot(written)) return written;
    edits.push(written);
  }
  const [selector, param] = found.chain.tail!.args as [N, N];
  edits.push(
    { start: selector.start, end: selector.end, text: quote(`#${targetId}`) },
    { start: param.start, end: param.end, text: quote(action.param) },
  );
  return { script: applyEdits(script, edits) };
}

/** Deletes a modulator's statement, and the control declarations of every node in it. */
export function removeModulator(
  script: string,
  modulator: NodeRef,
  ctx: EditContext,
): EditResult {
  const analysis = open(script, ctx);
  if (!isAnalysis(analysis)) return analysis;
  const found = modulatorChain(analysis, modulator);
  if (isCannot(found)) return found;
  const { chain } = found;
  const ids = chain.nodes.flatMap((call) =>
    call.id === null ? [] : [call.id],
  );
  return {
    script: applyEdits(script, [
      wholeLines(analysis.text, chain.start, chain.end),
      ...removeControlsOf(analysis, ids),
    ]),
  };
}
