/**
 * The script side of controls: the functions a script calls (`slider`, `knob`, `toggle`, `select`,
 * `controls`, `step grid`). Euclip puts them in scope beside cracked-up's helpers; cracked-up knows
 * nothing of them.
 *
 * A declaration does two things: it tells the host what it declares (plain data), and, if the project
 * holds a value for that control, it does the `set` right there. So a stored value passes through the
 * script as an ordinary `set` and the rebuild ends on it by the library's normal rules.
 *
 * What a control is bound to can be said with a selector string, or with what the script already has
 * in hand: a chain, a selection or a node. Those are turned into node ids here, at declaration time, so
 * only ids ever leave the script. A bus can be given too, for its level; only its name leaves.
 *
 * Everything here works from `__` and a small host interface of plain data in and out. It does not
 * touch the DOM, the document or the app, so the same code can run inside the sandbox, with the host
 * interface carried over the sandbox's link.
 */
import type { Bus, Node, ScopeApi } from 'cracked-up';
import {
  BUFFER_OPTION,
  CHANNEL_BUS,
  CONTROL_FUNCTIONS,
  WAVEFORM_PARAMS,
  WAVEFORM_PART,
  HOST_TAG,
  KIND_FOR_PARAM,
  type Binding,
  type ControlOptions,
  type Declaration,
  type DeclarationWarning,
} from 'client-v2/controls/declarations';
import {
  busKey,
  controlKey,
  stepGridKey,
  type StoredValue,
} from 'client-v2/project/schema';

/** What the script side needs from whoever runs the script. Plain data both ways. */
export interface ControlHost {
  /** the value the project holds for a control, if any. Read live, every time. */
  stored(key: string): StoredValue | undefined;
  /**
   * Takes a declaration. Returns false if it is not used: another declaration already controls the
   * same parameter of the same node and has the better claim (an explicit `slider` over `controls()`).
   */
  declare(declaration: Declaration): boolean;
  warn(warning: DeclarationWarning): void;
  /**
   * The script moved a control with `.set()`; the parameter (if it has one) has already been set.
   * `glide`: the seconds the parameter was given to get there (0: it is there when the set lands).
   */
  moved(key: string, value: StoredValue, glide?: number): void;
  /**
   * For a control whose number is not its parameter's (a sampler's speed synced to a sequence, which
   * holds a multiplier): what turns the control's number into the parameter's, as things stand when
   * it is called. Null for every other control. Asked after `declare`.
   */
  sync(key: string): ((value: number) => number) | null;
  /** seconds a control's parameter takes to get where the control is put, as things stand (0: at once) */
  glide(key: string): number;
  /**
   * For a control that has a value for every step of a sequence (as things stand when it is asked):
   * its value on the step now playing. Null for a control with a single value.
   */
  perStep(key: string): { value: number } | null;
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

function isNode(value: unknown): value is Node {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Node).id === 'string' &&
    typeof (value as Node).param === 'function' &&
    typeof (value as Node).type === 'string'
  );
}

function isBus(value: unknown): value is Bus {
  if (typeof value !== 'object' || value === null) return false;
  const bus = value as Partial<Bus>;
  return (
    typeof bus.name === 'string' &&
    typeof bus.insert === 'function' &&
    typeof bus.gain === 'object' &&
    bus.gain !== null &&
    typeof bus.gain.set === 'function'
  );
}

/** A node a waveform editor can be a view over: it plays a region of a sound. */
function isSampler(node: Node): boolean {
  return (
    'start' in node.params && 'end' in node.params && 'loop' in node.params
  );
}

/** A node Euclip made itself (a track's pan): never a script's to control. */
function isHostNode(node: Node): boolean {
  return node.tags[HOST_TAG] !== undefined;
}

const idSelector = (node: Node): string => `#${node.id}`;

/** What a control function was pointed at. */
interface Target {
  /** the nodes found, without the host's own */
  nodes: Node[];
  /** the selector string, when that is how it was said; null when the script passed nodes */
  selector: string | null;
  /** how to name it in a message */
  said: string;
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
): { functions: ControlApi; finish(): void } {
  /**
   * Turns what a function was given into nodes: a selector string, a chain (all of its nodes), a
   * selection, a node, or a list of nodes. Null if it is none of those.
   */
  function resolve(target: unknown): Target | null {
    if (typeof target === 'string') {
      if (target === '') return null;
      return {
        nodes: [...api(target)].filter((node) => !isHostNode(node)),
        selector: target,
        said: `'${target}'`,
      };
    }
    let nodes: unknown[] | null = null;
    let said = 'the nodes given';
    if (isNode(target)) {
      nodes = [target];
      said = `the ${target.type} "${target.id}"`;
    } else if (Array.isArray(target)) {
      nodes = target;
    } else if (typeof target === 'object' && target !== null) {
      const inner = (target as { nodes?: unknown }).nodes;
      if (Array.isArray(inner)) {
        nodes = inner; // a selection: its `nodes` is the list
        said = 'the selection given';
      } else if (
        typeof inner === 'object' &&
        inner !== null &&
        Symbol.iterator in inner
      ) {
        nodes = [...(inner as Iterable<unknown>)]; // a chain: its `nodes` is a selection
        said = 'the chain given';
      }
    }
    if (!nodes) return null;
    return {
      nodes: nodes.filter(isNode).filter((node) => !isHostNode(node)),
      selector: null,
      said,
    };
  }

  /** The nodes a control's bindings reach now (a handle outlives the build it was made in). */
  function reach(bindings: readonly Binding[]): Node[] {
    const nodes: Node[] = [];
    for (const binding of bindings) {
      if (binding.type !== 'param') continue;
      for (const node of api(binding.selector)) {
        if (!isHostNode(node)) nodes.push(node);
      }
    }
    return nodes;
  }

  /**
   * Declares one control over one parameter of the nodes given: one node, or several moved together.
   * @param selector the selector the script wrote, to key and bind the control by; null to key and
   *   bind it by the nodes' ids
   */
  function bound(
    call: string,
    fn: string,
    kind: string,
    accepts: readonly string[],
    nodes: readonly Node[],
    selector: string | null,
    param: string,
    options: ControlOptions,
    implicit: boolean,
    line: number | undefined,
    hidden = false,
  ): ControlHandle {
    const first = nodes[0];
    if (!first) return INERT;
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

    // Whether the parameter can glide is the library's to say (an audio-rate number); a control that
    // moves in steps has nothing to sweep through.
    const stepped =
      options.mode === 'stepped' ||
      options.step !== undefined ||
      options.values !== undefined;
    options = withGlide(
      options,
      call,
      meta.kind === 'number' && meta.rate === 'audio' && !stepped,
      meta.kind !== 'number'
        ? `"${param}" is not a number`
        : stepped
          ? 'a stepped control jumps from value to value'
          : `"${param}" is set at once and cannot be swept`,
      line,
    );
    const reached = nodes.filter((node) => param in node.params);
    const bindings: Binding[] =
      selector !== null
        ? [{ type: 'param', selector, param }]
        : reached.map((node) => ({
            type: 'param',
            selector: idSelector(node),
            param,
          }));
    const key = controlKey(
      selector ?? reached.map(idSelector).join(', '),
      param,
    );
    const used = host.declare({
      key,
      kind,
      bindings,
      nodes: reached.map((node) => node.id),
      options,
      implicit,
      ...(hidden ? { hidden } : {}),
      line,
    });
    if (!used) return INERT;

    const sync = host.sync(key);
    const set = (value: StoredValue, seconds = 0): void => {
      if (Array.isArray(value)) return;
      const applied = sync && typeof value === 'number' ? sync(value) : value;
      const how = seconds > 0 ? { glide: seconds } : undefined;
      for (const node of reach(bindings)) node.param(param).set(applied, how);
    };
    // The stored value passes through the script here, as an ordinary set. (A synced speed has a
    // value to set with nothing stored too: once through at the sequence's own pace.)
    const stored = host.stored(key);
    if (stored !== undefined) set(stored);
    else if (sync) set(1);

    return {
      get value() {
        const step = host.perStep(key);
        if (step) return step.value;
        return (
          host.stored(key) ??
          (sync ? 1 : reach(bindings)[0]?.param(param).value)
        );
      },
      set(value) {
        // (with a glide it starts where it is called, on the step in a callback, and sweeps from there)
        const seconds = host.glide(key);
        set(value, seconds);
        // A control that has a value for every step: the parameter goes where the script puts it
        // until the next step, whose own value then applies. Its lane is not rewritten.
        if (host.perStep(key)) return;
        host.moved(key, value, seconds);
      },
    };
  }

  /**
   * Declares a control for a bus's level, keyed by the bus's name. A bus has that one value to control;
   * its inserts are ordinary nodes. Only a bus of the script's own scope: the track's `channel` is the
   * channel strip's, and the project's buses are the project script's.
   */
  function busLevel(
    fn: string,
    kind: string,
    accepts: readonly string[],
    bus: Bus,
    param: unknown,
    options: ControlOptions,
    implicit: boolean,
    line: number | undefined,
  ): ControlHandle {
    const call = `${fn}(__.bus('${bus.name}')${typeof param === 'string' ? `, '${param}'` : ''})`;
    if (bus.scope !== api.scope) {
      host.warn({
        message:
          bus.name === CHANNEL_BUS
            ? `${call}: the level and pan of '${CHANNEL_BUS}' are the channel strip's, which Euclip provides for every track: there is no control to declare. Use the channel strip, or put a gain node of your own before .to('${CHANNEL_BUS}') and declare a control for that.`
            : `${call}: the bus '${bus.name}' is not this script's, so it cannot declare a control for it. Declare it in the script that makes the bus${bus.name === 'main' ? ' (Main Output)' : ''}.`,
        line,
      });
      return INERT;
    }
    if (param !== 'gain') {
      host.warn({
        message: `${call}: a bus has one value to control, its level. Write ${fn}(__.bus('${bus.name}'), 'gain'). (Its inserts are ordinary nodes: give one an id and declare a control for it.)`,
        line,
      });
      return INERT;
    }
    if (!accepts.includes('number')) {
      host.warn({
        message: `${call}: a bus's level is a number, which ${fn}() cannot show. Use slider() or knob().`,
        line,
      });
      return INERT;
    }
    options = withGlide(options, call, true, '', line);
    const key = busKey(bus.name);
    const used = host.declare({
      key,
      kind,
      bindings: [{ type: 'bus', name: bus.name }],
      nodes: [],
      options,
      implicit,
      line,
    });
    if (!used) return INERT;
    // A build leaves a bus's level where it was, so the declaration always says where it is: the stored
    // value, or with nothing stored the default (so that Reset has somewhere to go back to).
    const fallback = typeof options.default === 'number' ? options.default : 1;
    const stored = host.stored(key);
    bus.gain.set(typeof stored === 'number' ? stored : fallback);
    return {
      get value() {
        return host.stored(key) ?? fallback;
      },
      set(value) {
        if (typeof value !== 'number') return;
        const seconds = host.glide(key);
        bus.gain.set(value, seconds > 0 ? { glide: seconds } : undefined);
        host.moved(key, value, seconds);
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
    options = withGlide(
      options,
      `${kind}('${name}')`,
      false,
      'a control of its own has no parameter to sweep',
      line,
    );
    host.declare({
      key: name,
      kind,
      bindings: [{ type: 'value', name }],
      nodes: [],
      options,
      implicit: false,
      line,
    });
    const fallback =
      options.default ?? (kind === 'toggle' ? false : (options.min ?? 0));
    const handle: ControlHandle = {
      get value() {
        return host.stored(name) ?? fallback;
      },
      set(value) {
        host.moved(name, value);
      },
    };
    own.set(handle, name);
    return handle;
  }

  const functions: ControlApi = {};
  for (const fn of CONTROL_FUNCTIONS) {
    const kind = fn.kind;
    if (kind === null || kind === 'stepGrid' || kind === 'waveform') continue;
    functions[fn.name] = (
      first: unknown,
      second?: unknown,
      third?: unknown,
    ): ControlHandle => {
      const line = lineOfCaller();
      // slider('density', { min, max }): a control of its own
      if (
        typeof first === 'string' &&
        first !== '' &&
        typeof second !== 'string'
      ) {
        if (kind === 'select') {
          host.warn({
            message: `select('${first}', …) needs a parameter name as its second argument.`,
            line,
          });
          return INERT;
        }
        return standalone(kind, first, isOptions(second) ? second : {}, line);
      }
      if (isBus(first)) {
        return busLevel(
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
      let target: Target | null;
      try {
        target = resolve(first);
      } catch (error) {
        host.warn({
          message: `${fn.name}(${typeof first === 'string' ? `'${first}'` : '…'}): ${error instanceof Error ? error.message : String(error)}`,
          line,
        });
        return INERT;
      }
      if (!target || typeof second !== 'string') {
        host.warn({
          message: `${fn.name}() needs a selector, a chain, a selection, a node or a bus, then a parameter name; or a name and an object for a control of its own.`,
          line,
        });
        return INERT;
      }
      const call = `${fn.name}(${target.selector === null ? target.said : target.said}, '${second}')`;
      if (target.nodes.length === 0) {
        host.warn({
          message:
            target.selector === null
              ? `${call}: there are no nodes there, so there is no control.`
              : `${call}: the selector matches no node, so there is no control.`,
          line,
        });
        return INERT;
      }
      return bound(
        call,
        fn.name,
        kind,
        fn.accepts,
        target.nodes,
        target.selector,
        second,
        isOptions(third) ? third : {},
        false,
        line,
      );
    };
  }

  /**
   * `stepGrid('steps')`: a grid for a named sequence. A stored pattern is applied here, with the
   * sequence's own `update`, so it passes through the script like a stored slider value does.
   */
  functions['stepGrid'] = (name: unknown, options?: unknown): ControlHandle => {
    const line = lineOfCaller();
    if (typeof name !== 'string' || name === '') {
      host.warn({
        message:
          'stepGrid() needs the name of a sequence as its first argument.',
        line,
      });
      return INERT;
    }
    const sequence = api.transport.get(name);
    if (!sequence) {
      host.warn({
        message: `stepGrid('${name}'): there is no sequence called "${name}" at this point in the script, so there is no grid. Declare it after the __.transport.sequence('${name}', …) call.`,
        line,
        missingSequence: name,
      });
      return INERT;
    }
    return grid(name, isOptions(options) ? options : {}, false, line);
  };

  /** The sequences that have a grid declared, so that `controls()` adds one only where there is none. */
  /** The controls of its own this run has made, by the handle the script holds: `{ glide: thatControl }`. */
  const own = new WeakMap<object, string>();

  /**
   * The options as they are kept, with `glide` checked: a number of seconds, or a control of the
   * script's own (kept as its key). On a parameter that cannot glide it is said, and dropped.
   */
  function withGlide(
    options: ControlOptions,
    call: string,
    can: boolean,
    why: string,
    line: number | undefined,
  ): ControlOptions {
    const {
      glide,
      glideFrom: _never,
      ...rest
    } = options as ControlOptions & {
      glide?: unknown;
    };
    void _never;
    if (glide === undefined) return rest;
    if (!can) {
      host.warn({
        message: `${call}: glide does nothing here: ${why}. Remove it, or use it on a continuous audio parameter (a gain, a frequency, a pan).`,
        line,
      });
      return rest;
    }
    if (typeof glide === 'number' && Number.isFinite(glide) && glide >= 0) {
      return { ...rest, glide };
    }
    const from =
      typeof glide === 'object' && glide !== null ? own.get(glide) : undefined;
    if (from !== undefined) return { ...rest, glideFrom: from };
    host.warn({
      message: `${call}: glide needs a number of seconds (0 or more), or a control of this script's own: const glide = slider('glide', { min: 0, max: 2 }).`,
      line,
    });
    return rest;
  }

  const gridded = new Set<string>();
  /**
   * The sequences the script made with a count (`steps: 16`) and no pattern, as found the first time
   * each is given a grid: read before anything here writes a pattern into the sequence, since after
   * that its options hold the pattern.
   */
  const counted = new Set<string>();

  /** Declares the grid of a named sequence that exists, and applies the pattern the project holds for it. */
  function grid(
    name: string,
    options: ControlOptions,
    implicit: boolean,
    line: number | undefined,
  ): ControlHandle {
    const key = stepGridKey(name);
    gridded.add(name);
    host.declare({
      key,
      kind: 'stepGrid',
      bindings: [{ type: 'sequence', name }],
      nodes: [],
      options,
      implicit,
      line,
    });
    const stored = host.stored(key);
    const sequence = api.transport.get(name);
    if (sequence) {
      if (typeof sequence.options.steps === 'number') counted.add(name);
      // A sequence made with a count has no pattern of its own: its grid owns the pattern, and starts
      // empty. (Nothing is written into the project for that: only a step the person sets is.)
      const code = counted.has(name)
        ? sequence.steps.map(() => 0)
        : sequence.steps;
      if (Array.isArray(stored)) {
        sequence.update({ steps: fitSteps(stored, code) });
      } else if (counted.has(name)) {
        sequence.update({ steps: code });
      }
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
  }

  /**
   * `waveform('#sampler')`: a waveform editor for each sampler found. The editor is a view over
   * ordinary controls (the sampler's start, end, loop points, loop, reverse and speed, each with the
   * key a `slider` for it would have) and over the sound the sampler plays; what the project holds for
   * each is applied here, as any declaration applies its stored value.
   */
  functions['waveform'] = (first: unknown, second?: unknown): void => {
    const line = lineOfCaller();
    let target: Target | null = null;
    try {
      target = isBus(first) ? null : resolve(first);
    } catch (error) {
      host.warn({
        message: `waveform(${typeof first === 'string' ? `'${first}'` : '…'}): ${error instanceof Error ? error.message : String(error)}`,
        line,
      });
      return;
    }
    if (!target) {
      host.warn({
        message:
          "waveform() needs a sampler: a selector ('#sampler'), or a chain, a selection or a node.",
        line,
      });
      return;
    }
    const call = `waveform(${target.said})`;
    const samplers = target.nodes.filter(isSampler);
    if (samplers.length === 0) {
      host.warn({
        message:
          target.nodes.length === 0
            ? target.selector === null
              ? `${call}: there are no nodes there, so there is no waveform editor.`
              : `${call}: the selector matches no node, so there is no waveform editor.`
            : `${call}: there is no sampler there (found: ${[...new Set(target.nodes.map((node) => node.type))].join(', ')}), so there is no waveform editor. Point it at a sampler.`,
        line,
      });
      return;
    }
    const options = isOptions(second) ? second : {};
    for (const node of samplers) waveformOf(node, options, false, call, line);
  };

  /**
   * Declares the waveform editor of one sampler: the sound it plays (a stored choice is applied), its
   * region, loop and speed as ordinary controls, and the editor over them.
   */
  function waveformOf(
    node: Node,
    options: ControlOptions,
    implicit: boolean,
    call: string,
    line: number | undefined,
  ): void {
    const selector = idSelector(node);
    // The sound it plays, first: a stored choice is set here, after the node, so it has the last word.
    {
      const key = controlKey(selector, BUFFER_OPTION);
      host.declare({
        key,
        kind: BUFFER_OPTION,
        bindings: [{ type: 'option', selector, option: BUFFER_OPTION }],
        nodes: [node.id],
        options: {},
        implicit: true,
        hidden: true,
        line,
      });
      const stored = host.stored(key);
      if (typeof stored === 'string' && stored !== '') {
        node.setOption(BUFFER_OPTION, stored);
      }
    }
    const bindings: Binding[] = [];
    for (const name of WAVEFORM_PARAMS) {
      if (!(name in node.params)) continue;
      const meta = node.param(name).meta;
      bindings.push({ type: 'param', selector, param: name });
      bound(
        call,
        'waveform',
        KIND_FOR_PARAM[meta.kind],
        [meta.kind],
        [node],
        null,
        name,
        {},
        true,
        line,
        true,
      );
    }
    bindings.push({ type: 'option', selector, option: BUFFER_OPTION });
    host.declare({
      key: controlKey(selector, WAVEFORM_PART),
      kind: 'waveform',
      bindings,
      nodes: [node.id],
      options,
      implicit,
      line,
    });
  }

  /** The line of a `controls()` with no arguments, if the script has called it: see `finish`. */
  let everything: { line: number | undefined } | null = null;

  /**
   * `controls()`: all the UI of what the script makes. A control for every parameter of every node it
   * has made so far (a section per node), a waveform editor for every sampler among them, and a step
   * grid for every named sequence of the script (those are added when the script has finished, so a
   * sequence made after the call has its grid too). An explicit `slider`, `stepGrid` or `waveform` for
   * the same thing, before or after, is used instead.
   * `controls(target)`: the parameters of the nodes found, and nothing else.
   * `controls(target, ['speed'])`: only those named.
   * Each node's controls are keyed by that node's id, whatever found it.
   */
  functions['controls'] = (
    first?: unknown,
    list?: unknown,
  ): Record<string, Record<string, ControlHandle>> => {
    const line = lineOfCaller();
    const handles: Record<string, Record<string, ControlHandle>> = {};
    let target: Target | null;
    if (isBus(first)) {
      // A bus itself has only its level. (Its inserts are nodes: `controls()` finds them, and so does
      // `controls(__.bus('drums').compressor(…))`. They cannot be found from the bus here, because
      // while a script is running the bus does not yet list the inserts this run is adding.)
      handles[`bus ${first.name}`] = {
        gain: busLevel(
          'controls',
          'slider',
          ['number'],
          first,
          'gain',
          {},
          true,
          line,
        ),
      };
      return handles;
    }
    try {
      target =
        first === undefined
          ? {
              // what this script has made, in the order it made it: not other scripts' nodes, not
              // the insides of a macro
              nodes: [...api('*')].filter(
                (node) =>
                  node.scope === api.scope &&
                  node.parent === null &&
                  !isHostNode(node),
              ),
              selector: null,
              said: '',
            }
          : resolve(first);
    } catch (error) {
      host.warn({
        message: `controls(${typeof first === 'string' ? `'${first}'` : '…'}): ${error instanceof Error ? error.message : String(error)}`,
        line,
      });
      return handles;
    }
    if (!target) {
      host.warn({
        message:
          'controls() takes nothing (every node made so far), or a selector, a chain, a selection, a node or a bus, and then optionally a list of parameter names.',
        line,
      });
      return handles;
    }
    const call = `controls(${target.said}${Array.isArray(list) ? ', [...]' : ''})`;
    if (target.nodes.length === 0) {
      if (first === undefined) everything = { line };
      host.warn({
        message:
          first === undefined
            ? 'controls(): the script has made no nodes at this point, so there are no controls for nodes. Put it after the chain.'
            : target.selector === null
              ? `${call}: there are no nodes there, so there are no controls.`
              : `${call}: the selector matches no node, so there are no controls.`,
        line,
      });
      return handles;
    }
    const named = Array.isArray(list)
      ? list.filter((name): name is string => typeof name === 'string')
      : null;
    for (const name of named ?? []) {
      if (!target.nodes.some((node) => name in node.params)) {
        const example = target.nodes[0]!;
        host.warn({
          message: `${call}: ${example.type} "${example.id}" has no parameter "${name}". It has: ${Object.keys(example.params).join(', ')}.`,
          line,
        });
      }
    }
    for (const node of target.nodes) {
      const own: Record<string, ControlHandle> = {};
      for (const name of Object.keys(node.params)) {
        if (named && !named.includes(name)) continue;
        const meta = node.param(name).meta;
        if (meta.rate === 'init') continue;
        own[name] = bound(
          call,
          'controls',
          KIND_FOR_PARAM[meta.kind],
          [meta.kind],
          [node],
          null,
          name,
          {},
          true,
          line,
        );
      }
      handles[node.id] = own;
    }
    if (first === undefined) {
      everything = { line };
      for (const node of target.nodes) {
        if (isSampler(node)) waveformOf(node, {}, true, 'controls()', line);
      }
    }
    return handles;
  };

  return {
    functions,
    /**
     * Call when the script has run to its end, still inside the build: `controls()` gives every named
     * sequence of the script a grid, wherever in the script the sequence is made, unless a `stepGrid`
     * line has declared one.
     */
    finish(): void {
      if (!everything) return;
      for (const sequence of api.transport.sequences) {
        if (sequence.name === null || gridded.has(sequence.name)) continue;
        grid(sequence.name, {}, true, everything.line);
      }
    },
  };
}

/**
 * A stored pattern made to fit the sequence as the script now makes it. When the script's step count
 * has changed, the stored steps are kept as far as they go: a shorter sequence drops the extra ones, a
 * longer one takes its new steps from the script (`code`: its pattern, or all rests where the script
 * gives a count and the grid owns the pattern).
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
