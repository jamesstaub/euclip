/**
 * A guard against loops that never end. A script runs in the page, so `while (true) {}` typed by
 * accident would freeze the tab, and again on every reload because the script is stored.
 *
 * Before a script is compiled its loops are instrumented: the script is parsed (acorn) and every
 * `while`, `do...while`, `for`, `for...in` and `for...of` gets a counter at the top of its body that
 * looks at the clock every CHECK_EVERY iterations. A loop is wrapped in a block that takes its start
 * time, so each run of each loop has its own budget (LOOP_BUDGET_MS). That is why nothing has to be
 * reset when script code is entered later (a sequence callback, a step listener): a loop's clock
 * starts when the loop does. A loop that runs past its budget throws, and the error travels the
 * script-error path like any other.
 *
 * The edit is text insertion at node offsets and adds no new lines, so the rest of the script is
 * unchanged byte for byte and the lines in error messages stay the person's own. A script that does
 * not parse is returned as it is (and reported as a syntax error when compiled).
 *
 * KNOWN LIMITS: only loops are guarded. Recursion without a loop, and long synchronous work that is
 * one call (a huge `Array.from({ length: 1e9 })`, a giant `repeat`), are not caught. A loop is timed
 * on its own, so a loop of 0.9 s inside a loop of 1000 passes is not stopped by either budget.
 */
import * as acorn from 'acorn';

/** How long one loop may run, in milliseconds. */
export const LOOP_BUDGET_MS = 1000;
/** The clock is read once in this many iterations. */
const CHECK_EVERY = 1000;

/** The names the instrumented script calls: they are arguments of the compiled function. */
export const GUARD_NAMES = ['__lgNow', '__lgCheck'] as const;
export const GUARD_VALUES = [
  () => performance.now(),
  (start: number, line: number): void => {
    if (performance.now() - start > LOOP_BUDGET_MS) {
      throw new Error(
        `This loop ran for more than a second and was stopped (line ${line})`,
      );
    }
  },
];

interface N {
  type: string;
  start: number;
  end: number;
  body?: N | N[];
  [key: string]: unknown;
}

const LOOPS = new Set([
  'WhileStatement',
  'DoWhileStatement',
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
]);

interface Insertion {
  at: number;
  text: string;
}

/** The script with a guard in every loop; the script itself when it does not parse. */
export function guardLoops(code: string): string {
  let program: acorn.Program;
  try {
    program = acorn.parse(code, {
      ecmaVersion: 'latest',
      sourceType: 'script',
      allowReturnOutsideFunction: true,
      allowAwaitOutsideFunction: true,
    });
  } catch {
    return code;
  }
  const insertions: Insertion[] = [];
  let count = 0;

  const lineAt = (offset: number): number => {
    let line = 1;
    for (let i = code.indexOf('\n'); i !== -1 && i < offset;) {
      line += 1;
      i = code.indexOf('\n', i + 1);
    }
    return line;
  };

  const visit = (node: N, labels: N[]): void => {
    if (LOOPS.has(node.type)) {
      const id = count++;
      const outer = labels[0] ?? node;
      const body = node.body as N;
      const counter = `__lc${id}`;
      const guard = `if(++${counter}>=${CHECK_EVERY}){${counter}=0;__lgCheck(__ls${id},${lineAt(node.start)})}`;
      insertions.push({
        at: outer.start,
        text: `{let ${counter}=0,__ls${id}=__lgNow();`,
      });
      if (body.type === 'BlockStatement') {
        insertions.push({ at: body.start + 1, text: guard });
      } else {
        insertions.push({ at: body.start, text: `{${guard}` });
        insertions.push({ at: body.end, text: '}' });
      }
      insertions.push({ at: outer.end, text: '}' });
    }
    const nextLabels =
      node.type === 'LabeledStatement' ? [...labels, node] : [];
    for (const [key, value] of Object.entries(node)) {
      if (key === 'type' || typeof value !== 'object' || value === null) {
        continue;
      }
      for (const child of Array.isArray(value) ? value : [value]) {
        if (
          child &&
          typeof child === 'object' &&
          typeof (child as N).type === 'string'
        ) {
          visit(child as N, nextLabels);
        }
      }
    }
  };
  visit(program as unknown as N, []);
  if (insertions.length === 0) return code;

  // Front to back; at one offset, in the order they were made (an outer loop's before an inner's).
  const ordered = insertions
    .map((insertion, index) => ({ insertion, index }))
    .sort((a, b) => a.insertion.at - b.insertion.at || a.index - b.index);
  let out = '';
  let from = 0;
  for (const { insertion } of ordered) {
    out += code.slice(from, insertion.at) + insertion.text;
    from = insertion.at;
  }
  return out + code.slice(from);
}
