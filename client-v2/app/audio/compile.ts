/**
 * Turns a script's text into a function, the way the cracked-up demo does: the script's body becomes
 * the body of a function whose arguments are `__` and the library's helpers (`euclid`, `scale`, ...).
 *
 * This is direct execution: the script runs in the page with the page's privileges, which is right for
 * a person's own project. In collaboration mode the same text is to run in the sandbox instead
 * (`cracked-up/remote`); that is the one place to change: `compile` would hand the text to the sandbox
 * and the runner would `dispatch` the commands it sends back.
 *
 * TODO(endless-loop guard): a script that never returns (`while (true) {}`) freezes the page when run
 * this way. Nothing here protects against it yet.
 */
import type { ScopeApi } from 'cracked-up';
import { helpers, wrapUserCode } from 'cracked-up/util';

/** A compiled script: call it with the `__` of the scope it is to build in. */
export type Program = (api: ScopeApi) => void;

const HELPER_NAMES = Object.keys(helpers);
const HELPER_VALUES = Object.values(helpers);

/** Compiles a script. Throws a SyntaxError, having run nothing, if the text is not valid. */
export function compile(code: string): Program {
  // The whole point of the app is to run the code its user writes.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const program = new Function('__', ...HELPER_NAMES, wrapUserCode(code)) as (
    api: ScopeApi,
    ...helpers: unknown[]
  ) => void;
  return (api) => program(api, ...HELPER_VALUES);
}
