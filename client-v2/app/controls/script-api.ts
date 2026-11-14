/**
 * The script side of controls: the functions a script calls (`slider`, `knob`, `toggle`, `select`,
 * `controls`). Euclip puts them in scope beside cracked-up's helpers; cracked-up knows nothing of them.
 *
 * A declaration does two things: it tells the host what it declares (plain data), and, if the project
 * holds a value for that control, it does the `set` right there. So a stored value passes through the
 * script as an ordinary `set` and the rebuild ends on it by the library's normal rules.
 *
 * Everything here works from `__` and a small host interface of plain data in and out. It does not
 * touch the DOM, the document or the app, so the same code can run inside the sandbox, with the host
 * interface carried over the sandbox's link.
 */
import type { ScopeApi } from 'cracked-up';
import {
  CONTROL_FUNCTIONS,
  KIND_FOR_PARAM,
  type ControlOptions,
  type Declaration,
  type DeclarationWarning,
} from 'client-v2/controls/declarations';
import {
  controlKey,
  sequencerKey,
  type StoredValue,
} from 'client-v2/project/schema';

/** What the script side needs from whoever runs the script. Plain data both ways. */
export interface ControlHost {
  /** the value the project holds for a control, if any. Read live, every time. */
  stored(key: string): StoredValue | undefined;
  declare(declaration: Declaration): void;
  warn(warning: DeclarationWarning): void;
  /** the script moved a control with `.set()`; the parameter (if it has one) has already been set */
  moved(key: string, value: StoredValue): void;
}

/** What a declaration returns to the script. */
export interface ControlHandle {
  /** the control's value: what the project holds, else the parameter's own (or the declared default) */
  readonly value: StoredValue | undefined;
  /** moves the control and its parameter together, as if the user had. In a callback it lands on the step. */
  set(value: StoredValue): void;
}

export type ControlApi = Record<string, (...args: unknown[]) => unknown>;

const INERT: ControlHandle = { value: undefined, set: () => undefined };

function isOptions(value: unknown): value is ControlOptions {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The control functions for one run of one script.
 * @param api the script's `__`
 * @param lineOfCaller the script line the function calling it was called from, when it can be told
 */
export function createControlApi(
  api: ScopeApi,
  host: ControlHost,
  lineOfCaller: () => number | undefined = () => undefined,
): ControlApi {
  /** Declares a control on one parameter of the nodes a selector finds. */
  function bound(
    fn: string,
    kind: string,
    accepts: readonly string[],
    selector: string,
    param: string,
    options: ControlOptions,
    implicit: boolean,
    line: number | undefined,
  ): ControlHandle {
    const call = `${fn}('${selector}', '${param}')`;
    let nodes;
    try {
      nodes = [...api(selector)];
    } catch (error) {
      host.warn({
        message: `${call}: ${error instanceof Error ? error.message : String(error)}`,
        line,
      });
      return INERT;
    }
    const first = nodes[0];
    if (!first) {
      host.warn({
        message: `${call}: the selector matches no node, so there is no control.`,
        line,
      });
      return INERT;
    }
    const names = Object.keys(first.params);
    if (!names.includes(param)) {
      host.warn({
        message: `${call}: ${first.type} "${first.id}" has no parameter "${param}". It has: ${names.join(', ')}.`,
        line,
      });
      return INERT;
    }
    const meta = first.param(param).meta;
    if (!accepts.includes(meta.kind)) {
      const right = KIND_FOR_PARAM[meta.kind];
      host.warn({
        message: `${call}: "${param}" is ${meta.kind === 'boolean' ? 'true or false' : `a ${meta.kind}`}, which ${fn}() cannot show. Use ${right}().`,
        line,
      });
      return INERT;
    }
    if (meta.rate === 'init') {
      host.warn({
        message: `${call}: "${param}" is fixed when the node is made and cannot be changed afterwards.`,
        line,
      });
      return INERT;
    }

    const key = controlKey(selector, param);
    host.declare({
      key,
      kind,
      bindings: [{ type: 'param', selector, param }],
      options,
      implicit,
      line,
    });
    // The stored value passes through the script here, as an ordinary set.
    const stored = host.stored(key);
    if (stored !== undefined && !Array.isArray(stored)) {
      api(selector).set({ [param]: stored });
    }

    return {
      get value() {
        return host.stored(key) ?? [...api(selector)][0]?.param(param).value;
      },
      set(value) {
        if (Array.isArray(value)) return;
        api(selector).set({ [param]: value });
        host.moved(key, value);
      },
    };
  }

  /** Declares a control with no node: a value of its own, kept in the project under its name. */
  function standalone(
    kind: string,
    name: string,
    options: ControlOptions,
    line: number | undefined,
  ): ControlHandle {
    host.declare({
      key: name,
      kind,
      bindings: [{ type: 'value', name }],
      options,
      implicit: false,
      line,
    });
    const fallback =
      options.default ?? (kind === 'toggle' ? false : (options.min ?? 0));
    return {
      get value() {
        return host.stored(name) ?? fallback;
      },
      set(value) {
        host.moved(name, value);
      },
    };
  }

  const functions: ControlApi = {};
  for (const fn of CONTROL_FUNCTIONS) {
    const kind = fn.kind;
    if (kind === null || kind === 'sequencer') continue;
    functions[fn.name] = (
      first: unknown,
      second?: unknown,
      third?: unknown,
    ): ControlHandle => {
      const line = lineOfCaller();
      if (typeof first !== 'string' || first === '') {
        host.warn({
          message: `${fn.name}() needs a selector or a name as its first argument.`,
          line,
        });
        return INERT;
      }
      if (typeof second === 'string') {
        return bound(
          fn.name,
          kind,
          fn.accepts,
          first,
          second,
          isOptions(third) ? third : {},
          false,
          line,
        );
      }
      if (kind === 'select') {
        host.warn({
          message: `select('${first}', …) needs a parameter name as its second argument.`,
          line,
        });
        return INERT;
      }
      return standalone(kind, first, isOptions(second) ? second : {}, line);
    };
  }

  /**
   * `sequencer('steps')`: a grid for a named sequence. A stored pattern is applied here, with the
   * sequence's own `update`, so it passes through the script like a stored slider value does.
   */
  functions['sequencer'] = (
    name: unknown,
    options?: unknown,
  ): ControlHandle => {
    const line = lineOfCaller();
    if (typeof name !== 'string' || name === '') {
      host.warn({
        message:
          'sequencer() needs the name of a sequence as its first argument.',
        line,
      });
      return INERT;
    }
    const sequence = api.transport.get(name);
    if (!sequence) {
      host.warn({
        message: `sequencer('${name}'): there is no sequence called "${name}" at this point in the script, so there is no grid. Declare it after the __.transport.sequence('${name}', …) call.`,
        line,
        missingSequence: name,
      });
      return INERT;
    }
    const key = sequencerKey(name);
    host.declare({
      key,
      kind: 'sequencer',
      bindings: [{ type: 'sequence', name }],
      options: isOptions(options) ? options : {},
      implicit: false,
      line,
    });
    const stored = host.stored(key);
    if (Array.isArray(stored)) {
      sequence.update({ steps: fitSteps(stored, sequence.steps) });
    }
    return {
      get value() {
        const live = api.transport.get(name);
        return live ? [...live.steps] : [];
      },
      set(value) {
        if (!Array.isArray(value)) return;
        api.transport.get(name)?.update({ steps: value });
        host.moved(key, [...value]);
      },
    };
  };

  /** `controls('#kick')`: every parameter, under "more". `controls('#kick', ['speed'])`: those named. */
  functions['controls'] = (
    selector: unknown,
    list?: unknown,
  ): Record<string, ControlHandle> => {
    const line = lineOfCaller();
    const handles: Record<string, ControlHandle> = {};
    if (typeof selector !== 'string' || selector === '') {
      host.warn({
        message: 'controls() needs a selector as its first argument.',
        line,
      });
      return handles;
    }
    let first;
    try {
      first = [...api(selector)][0];
    } catch (error) {
      host.warn({
        message: `controls('${selector}'): ${error instanceof Error ? error.message : String(error)}`,
        line,
      });
      return handles;
    }
    if (!first) {
      host.warn({
        message: `controls('${selector}'): the selector matches no node, so there are no controls.`,
        line,
      });
      return handles;
    }
    const all = Object.keys(first.params);
    const named = Array.isArray(list)
      ? list.filter((name): name is string => typeof name === 'string')
      : null;
    for (const name of named ?? all) {
      if (!all.includes(name)) {
        host.warn({
          message: `controls('${selector}', [...]): ${first.type} "${first.id}" has no parameter "${name}". It has: ${all.join(', ')}.`,
          line,
        });
        continue;
      }
      const meta = first.param(name).meta;
      if (meta.rate === 'init') continue;
      handles[name] = bound(
        'controls',
        KIND_FOR_PARAM[meta.kind],
        [meta.kind],
        selector,
        name,
        {},
        named === null,
        line,
      );
    }
    return handles;
  };

  return functions;
}

/**
 * A stored pattern made to fit the sequence as the script now makes it. When the script's step count
 * has changed, the stored steps are kept as far as they go: a shorter sequence drops the extra ones, a
 * longer one takes its new steps from the script.
 */
export function fitSteps(
  stored: readonly number[],
  code: readonly number[],
): number[] {
  return code.map((value, index) => stored[index] ?? value);
}

/** The names the control functions take in a script's scope. */
export const CONTROL_NAMES: readonly string[] = CONTROL_FUNCTIONS.map(
  (fn) => fn.name,
);
