/**
 * Turns a script's text into a function, the way the cracked-up demo does: the script's body becomes
 * the body of a function whose arguments are `__`, the library's helpers (`euclid`, `scale`, ...) and
 * Euclip's control functions (`slider`, `knob`, `toggle`, `select`, `controls`).
 *
 * This is direct execution: the script runs in the page with the page's privileges, which is right for
 * a person's own project. In collaboration mode the same text is to run in the sandbox instead
 * (`cracked-up/remote`); that is the one place to change: `compile` would hand the text to the sandbox
 * and the runner would `dispatch` the commands it sends back.
 *
 * Loops are guarded first (`guardLoops`): one that runs for more than a second throws instead of
 * freezing the page. See loop-guard.ts for what that does not cover.
 */
import type { ScopeApi } from 'cracked-up';
import { helpers, wrapUserCode } from 'cracked-up/util';
import {
  GUARD_NAMES,
  GUARD_VALUES,
  guardLoops,
} from 'client-v2/audio/loop-guard';
import { CONTROL_NAMES, type ControlApi } from 'client-v2/controls/script-api';

/** A compiled script: call it with the `__` of the scope it is to build in, and its control functions. */
export type Program = (api: ScopeApi, controls: ControlApi) => void;

const HELPER_NAMES = Object.keys(helpers);
const HELPER_VALUES = Object.values(helpers);

function build(code: string): (...args: unknown[]) => void {
  // The whole point of the app is to run the code its user writes.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return new Function(
    '__',
    ...HELPER_NAMES,
    ...CONTROL_NAMES,
    ...GUARD_NAMES,
    wrapUserCode(guardLoops(code)),
  ) as (...args: unknown[]) => void;
}

/** Compiles a script. Throws a SyntaxError, having run nothing, if the text is not valid. */
export function compile(code: string): Program {
  const program = build(code);
  return (api, controls) =>
    program(
      api,
      ...HELPER_VALUES,
      ...CONTROL_NAMES.map((name) => controls[name]),
      ...GUARD_VALUES,
    );
}

// --- Which line of a script a call came from --------------------------------------------------------

/** The first `anonymous:LINE:COLUMN` (Chromium, Safari) or `Function:LINE:COLUMN` (Firefox) of a stack. */
function scriptLineIn(stack: string | undefined): number | undefined {
  const match =
    /(?:<anonymous>|\bFunction|eval[^)\n]*?):(\d+):\d+\)?\s*(?:\n|$)/.exec(
      stack ?? '',
    );
  return match ? Number(match[1]) : undefined;
}

let wrapperLines: number | undefined;

/**
 * How many lines the compiled function has before the script's first line, found once by compiling a
 * one-line script that reports where it is.
 */
function linesBeforeScript(): number {
  if (wrapperLines === undefined) {
    let seen: number | undefined;
    try {
      build('__();')(() => {
        seen = scriptLineIn(new Error().stack);
      });
    } catch {
      // no stack to read in this browser: lines are simply not reported
    }
    wrapperLines = seen === undefined ? NaN : seen - 1;
  }
  return wrapperLines;
}

/**
 * The line of the script (counted from 1) that is on the stack right now, or undefined when the browser
 * does not say. Call it from a function the script called directly or one call deep.
 */
export function currentScriptLine(): number | undefined {
  const line = scriptLineIn(new Error().stack);
  const before = linesBeforeScript();
  return line === undefined || Number.isNaN(before) ? undefined : line - before;
}
