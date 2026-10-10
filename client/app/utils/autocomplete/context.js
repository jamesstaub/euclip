/**
 * Works out what the user is in the middle of typing, from the text before the cursor.
 *
 * The lezer parse tree is not used for this because it is unreliable for half-typed code
 * (`__().sine({fre` parses as a destructuring pattern, for example). Instead we make one
 * string/comment aware pass over the source, tracking open brackets, which is cheap for
 * script-sized documents and gives the same answer however broken the rest of the code is.
 *
 * Returns one of:
 *   { kind: 'selector', quote, from, query, receiver }   inside the string in `__("|")`
 *   { kind: 'member', from, receiver }                   after a `.`, e.g. `__().sine().|`
 *   { kind: 'key', from, method, used }                  object key in `.sine({ | })`
 *   { kind: 'value', from, method, key }                 object value in `.sampler({ path: | })`
 *   { kind: 'root', from, query }                        an identifier at the start of an expression
 *   null                                                 nothing to complete (comments, other strings)
 *
 * A `receiver` describes the expression a `.` hangs off:
 *   { type: 'util' }                        `__.`
 *   { type: 'scope' }                       `this.`
 *   { type: 'chain', first, hasNodes }      `__(...)...` / `this.select(...)...`
 *       first:    true when the chain was started with no selector, `__().`
 *       lastCall: name of the last method called in the chain, if any
 */

const IDENT = /[\w$]/;

function isChainStart(callee) {
  return callee === '__' || callee === 'this.select';
}

/**
 * Walk back from `end` over an expression like `__("a").sine({}).lowpass()` and describe it.
 * `pairs` maps the position of every closing bracket to its opening bracket.
 */
function describeReceiver(text, end, pairs) {
  const segments = []; // innermost-last, e.g. ['__', 'sine', 'lowpass']
  let i = end;
  const skipSpace = () => {
    while (i > 0 && /\s/.test(text[i - 1])) i--;
  };

  for (;;) {
    skipSpace();
    let args = null; // { open, close } of the call's argument list
    if (text[i - 1] === ')') {
      const open = pairs.get(i - 1);
      if (open === undefined) return null;
      args = { open, close: i - 1 };
      i = open;
      skipSpace();
    }
    let j = i;
    while (j > 0 && IDENT.test(text[j - 1])) j--;
    if (j === i) return null;
    segments.unshift({ name: text.slice(j, i), called: args !== null, args });
    i = j;
    skipSpace();
    if (text[i - 1] === '.') {
      i--;
      continue;
    }
    break;
  }

  const [root, second] = segments;
  const emptyArgs = ({ args }) =>
    args && text.slice(args.open + 1, args.close).trim() === '';
  const first = segments.length === 1 && emptyArgs(root);
  if (root.name === '__') {
    if (!root.called && segments.length === 1) return { type: 'util' };
    return {
      type: 'chain',
      first,
      lastCall: segments.length > 1 ? segments[segments.length - 1].name : null,
    };
  }
  if (root.name === 'this') {
    if (segments.length === 1) return { type: 'scope' };
    if (second.name === 'select' && second.called) {
      return {
        type: 'chain',
        first: segments.length === 2 && emptyArgs(second),
        lastCall:
          segments.length > 2 ? segments[segments.length - 1].name : null,
      };
    }
  }
  return null;
}

export function analyzeContext(text) {
  const stack = []; // open brackets: { ch, pos, callee }
  const pairs = new Map(); // closing pos -> opening pos
  let i = 0;
  let str = null; // { quote, start }

  const calleeBefore = (pos) => {
    let k = pos;
    while (k > 0 && /\s/.test(text[k - 1])) k--;
    const end = k;
    while (k > 0 && (IDENT.test(text[k - 1]) || text[k - 1] === '.')) k--;
    return k === end ? null : text.slice(k, end);
  };

  while (i < text.length) {
    const c = text[i];
    if (str) {
      if (c === '\\') {
        i += 2;
        continue;
      }
      if (c === str.quote) str = null;
      i++;
      continue;
    }
    if (c === '/' && text[i + 1] === '/') {
      const nl = text.indexOf('\n', i);
      if (nl === -1) return null; // cursor is inside a line comment
      i = nl;
      continue;
    }
    if (c === '/' && text[i + 1] === '*') {
      const close = text.indexOf('*/', i + 2);
      if (close === -1) return null; // cursor is inside a block comment
      i = close + 2;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      str = { quote: c, start: i };
      i++;
      continue;
    }
    if (c === '(' || c === '[' || c === '{') {
      stack.push({ ch: c, pos: i, callee: c === '(' ? calleeBefore(i) : null });
    } else if (c === ')' || c === ']' || c === '}') {
      const open = stack.pop();
      if (open) pairs.set(i, open.pos);
    }
    i++;
  }

  const top = stack[stack.length - 1];

  if (str) {
    if (str.quote === '`' && /\$\{/.test(text.slice(str.start))) return null;
    const call = top && top.ch === '(' ? top : null;
    if (!call || !isChainStart(call.callee)) return null;
    // only the first argument of __() / this.select() is a selector
    if (text.slice(call.pos + 1, str.start).trim() !== '') return null;
    return {
      kind: 'selector',
      quote: str.quote,
      from: str.start + 1,
      query: text.slice(str.start + 1),
    };
  }

  // member access: `<receiver>.<partial>`
  const member = /\.\s*([\w$]*)$/.exec(text);
  if (member && !/\d\.\s*$/.test(text.slice(0, member.index + 1))) {
    const dot = member.index;
    const receiver = describeReceiver(text, dot, pairs);
    if (!receiver) return null;
    return { kind: 'member', from: text.length - member[1].length, receiver };
  }

  // object literal inside a method call: `.sine({ | })`
  const objectContext =
    top && top.ch === '{' ? analyzeObject(text, stack) : null;
  if (objectContext) return objectContext;

  // a bare identifier, e.g. the start of a new statement
  const word = /[\w$]*$/.exec(text)[0];
  return { kind: 'root', from: text.length - word.length, query: word };
}

function analyzeObject(text, stack) {
  const top = stack[stack.length - 1];
  const open = stack[stack.length - 2];
  if (!open || open.ch !== '(' || !open.callee) return null;
  // only the first argument is the params object
  if (text.slice(open.pos + 1, top.pos).trim() !== '') return null;
  const method = open.callee.split('.').pop();

  // split the object body into top-level `key: value` entries
  const entries = splitTopLevel(text.slice(top.pos + 1));
  const current = entries[entries.length - 1];
  const used = entries
    .slice(0, -1)
    .map((e) => /^\s*['"]?([\w$]+)['"]?\s*:/.exec(e)?.[1])
    .filter(Boolean);

  const value = /^\s*['"]?([\w$]+)['"]?\s*:\s*([\w$.]*)$/.exec(current);
  if (value) {
    return {
      kind: 'value',
      from: text.length - value[2].length,
      method,
      key: value[1],
    };
  }
  const key = /^\s*([\w$]*)$/.exec(current);
  if (key) {
    return { kind: 'key', from: text.length - key[1].length, method, used };
  }
  return null;
}

// split on commas that are not nested in brackets/strings
function splitTopLevel(body) {
  const parts = [''];
  let depth = 0;
  let quote = null;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (quote) {
      if (c === '\\') {
        parts[parts.length - 1] += c + (body[++i] ?? '');
        continue;
      }
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'" || c === '`') {
      quote = c;
    } else if ('([{'.includes(c)) {
      depth++;
    } else if (')]}'.includes(c)) {
      depth--;
    } else if (c === ',' && depth === 0) {
      parts.push('');
      continue;
    }
    parts[parts.length - 1] += c;
  }
  return parts;
}
