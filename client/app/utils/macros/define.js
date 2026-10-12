import { clearCustomMacros, registerCustomMacro } from './library';

/**
 * Macros a project defines in its macros script:
 *
 *   this.defineMacro('wobble', {
 *     controls: { rate: { min: 0.1, max: 20, default: 4 }, ... },   // the schema: how its settings are controlled
 *     create(settings) { __().osc().gain({ gain: settings.depth }); },  // adds the nodes (euclip wraps them in the macro)
 *     update(changes, el) { ... },                                    // a control changed: apply `changes`
 *     methods: { noteOn(args, el) { ... } },                          // extra methods: __('wobble').wobble('noteOn', args)
 *   });
 *
 * After that `__().wobble({ rate: 6 })` works in any track's script, and its settings are controls like a
 * built-in macro's. (The macro's name is a cracked function; see the macro-menu's examples.)
 */

// what a name held before the project replaced it (a built-in macro), to put back when the definition goes
const replaced = new Map();
const installed = new Set();

function cracked() {
  return window.cracked;
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function defineMacro(name, definition) {
  if (typeof name !== 'string' || !/^[a-z_][a-z0-9_]*$/i.test(name)) {
    throw new Error(`defineMacro: "${name}" is not a usable macro name (letters, digits and _)`);
  }
  if (!isObject(definition) || typeof definition.create !== 'function') {
    throw new Error(`defineMacro('${name}', ...): the definition needs a create(settings) function`);
  }

  const schema = definition.controls ?? {};
  const defaults = Object.fromEntries(
    Object.entries(schema).map(([key, spec]) => [
      key,
      spec.type === 'choice' ? spec.choices?.[spec.default] : spec.default,
    ])
  );

  registerCustomMacro({
    key: name,
    title: definition.title ?? name,
    description: definition.description ?? '',
    schema,
    initScript: '',
    onstepScript: '',
  });

  const c = cracked();
  if (!installed.has(name)) {
    if (typeof c[name] === 'function') replaced.set(name, c[name]);
    installed.add(name);
  }

  c[name] = function (method, argument) {
    // __('wobble').wobble('update', { rate: 6 })  /  __('wobble').wobble('noteOn', ...)
    if (typeof method === 'string') {
      c.each(name, (el) => {
        if (method === 'update') {
          Object.assign(el.getParams().settings, argument);
          definition.update?.(argument ?? {}, el);
        } else if (typeof definition.methods?.[method] === 'function') {
          definition.methods[method](argument, el);
        }
      });
      return c;
    }

    // __().wobble({ rate: 6 }): make the macro, with the settings given over the schema's defaults
    const settings = { ...defaults, ...(isObject(method) ? method : {}) };
    c.begin(name, settings);
    definition.create(settings);
    c.end(name);
    return c;
  };
}

/** Forget every macro the project defined, putting back any built-in macro it replaced. */
export function undefineMacros() {
  const c = cracked();
  installed.forEach((name) => {
    if (replaced.has(name)) c[name] = replaced.get(name);
    else delete c[name];
  });
  installed.clear();
  replaced.clear();
  clearCustomMacros();
}
