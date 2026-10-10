import { snippet, startCompletion } from '@codemirror/autocomplete';
import { objectCompletions } from './object-completions';
import { argCompletions } from './arg-completions';
import { supportedAudioNodes } from '../audio-node-config';
import { getSelectorLookupKeys } from '../cracked';

/**
 * Builds the CodeMirror `Completion` lists for each context found by `analyzeContext`.
 * The raw method / option data comes from the JSDoc-derived files next to this one.
 */

// Method categories (the `type` field of object-completions) that make sense in each place.
const CHAIN_SOURCES = [
  'Sampler',
  'Oscillator',
  'Noise',
  'Modulator',
  'Synth',
  'Node',
];
const CHAIN_PROCESSORS = [
  'Filter',
  'Delay',
  'Distortion',
  'Envelope',
  'Miscellaneous',
];
const CHAIN_METHODS = [
  ...CHAIN_SOURCES,
  ...CHAIN_PROCESSORS,
  'Setters',
  'Control',
  'Connect',
  'Find',
];
const UTIL_EXCLUDED = ['Setters'];
// methods that live on `__` itself rather than on a selection
const UTIL_TYPES = [
  'Sequence',
  'Macro',
  'Midi',
  'Algorithmic',
  'Utility',
  'Interaction',
  'Connect',
  'Control',
  'Find',
];

// properties rather than methods, so no `()` is applied
const NOT_CALLABLE = new Set(['scales', 'chords']);

// Things available on `this` inside a track script (see `scriptScope` in models/track.ts)
const SCOPE_MEMBERS = [
  {
    label: 'select',
    call: true,
    info: 'Select nodes in this track: this.select("lowpass") scopes the selector to this track',
    boost: 10,
  },
  {
    label: 'play',
    call: true,
    info: 'Play this track’s source nodes and trigger its envelopes',
    boost: 9,
  },
  { label: 'stop', call: true, info: 'Stop this track’s source nodes' },
  {
    label: 'filepath',
    info: 'URL of the sound file chosen in the file picker; pass it as `path` to a sampler',
    boost: 8,
  },
  { label: 'files', info: 'All sound file URLs downloaded for this track' },
  {
    label: 'controls',
    info: 'Values of this track’s controls at the current step',
  },
  { label: 'sliders', info: 'Control data for this track' },
  {
    label: 'trackSelector',
    info: 'Class selector unique to this track, e.g. ".track-1"',
  },
  { label: 'id', info: 'Track id' },
  {
    label: 'playSourceNodes',
    call: true,
    info: 'Restart this track’s source nodes, optionally applying attrs',
  },
  {
    label: 'playADSRNodes',
    call: true,
    info: 'Trigger this track’s ADSR envelopes',
  },
].map((m) => ({ ...m, type: m.call ? 'method' : 'property' }));

// Keys any node accepts in its params object, whatever the node
const COMMON_KEYS = [
  {
    key: 'id',
    type: 'String',
    detail: 'unique name; select it with __("#name")',
    value: "''",
  },
  {
    key: 'class',
    type: 'String',
    detail: 'comma-separated class names; select with __(".name")',
    value: "''",
  },
];

const EXPLICIT_VALUES = {
  path: ['this.filepath'],
};

function plainInfo(html = '') {
  const text = html
    .split(/<pre>|\n\s*\n/)[0]
    .replace(/<[^>]+>/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .trim();
  return text.length > 400 ? `${text.slice(0, 397)}…` : text;
}

function exampleOf(html = '') {
  const m = /<code>([\s\S]*?)<\/code>/.exec(html);
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : null;
}

function infoNode(c) {
  const description = plainInfo(c.detail);
  const example = exampleOf(c.detail);
  if (!description && !example) return null;
  return () => {
    const dom = document.createElement('div');
    dom.className = 'cracked-completion-info';
    if (description) {
      const p = document.createElement('p');
      p.textContent = description;
      dom.append(p);
    }
    if (example) {
      const pre = document.createElement('pre');
      pre.textContent = example.split('\n').slice(0, 8).join('\n');
      dom.append(pre);
    }
    return dom;
  };
}

// methods whose first argument is a params object (`.lowpass({ frequency: 440 })`)
function takesParamsObject(name) {
  return (argCompletions[name] || []).some((a) => a.label.includes('.'));
}

// apply a snippet, then open the next completion menu (option keys or selector)
function applySnippet(template) {
  const run = snippet(template);
  return (view, completion, from, to) => {
    run(view, completion, from, to);
    setTimeout(() => startCompletion(view), 0);
  };
}

function methodCompletion(c, boost) {
  const callable = !NOT_CALLABLE.has(c.label);
  let apply = c.label;
  if (callable) {
    apply = takesParamsObject(c.label)
      ? applySnippet(`${c.label}({ \${} })`)
      : applySnippet(`${c.label}(\${})`);
  }
  return {
    label: c.label,
    type: callable ? 'method' : 'property',
    detail: c.type,
    info: infoNode(c),
    apply,
    boost,
  };
}

const methods = objectCompletions.filter(
  (c) => c.label && !c.label.startsWith('_')
);
const methodNames = new Set(methods.map((c) => c.label));

function methodsOfTypes(types, boosts = {}) {
  return methods
    .filter((c) => types.includes(c.type))
    .map((c) => methodCompletion(c, boosts[c.type] ?? 0));
}

/** Methods available after `.` for each kind of receiver. */
export function memberCompletions(receiver) {
  switch (receiver.type) {
    case 'util':
      return methods
        .filter((c) => !UTIL_EXCLUDED.includes(c.type))
        .map((c) => methodCompletion(c, UTIL_TYPES.includes(c.type) ? 50 : 0));
    case 'scope':
      return SCOPE_MEMBERS.map((m) => ({
        label: m.label,
        type: m.type,
        info: m.info,
        boost: m.boost ?? 0,
        apply: m.call ? applySnippet(`${m.label}(\${})`) : m.label,
      }));
    case 'chain':
      return chainCompletions(receiver);
    default:
      return [];
  }
}

// What a user most likely wants next in a signal chain:
//   start of a chain      -> a sound source (sampler, oscillators, noise, lfo...)
//   after a source/effect -> effects, then the output (`dac`)
//   after a selector      -> setters, start/stop, effects
function chainCompletions({ first, lastCall }) {
  let boosts;
  if (first) {
    boosts = {
      Sampler: 100,
      Oscillator: 90,
      Noise: 70,
      Modulator: 60,
      Synth: 80,
      Node: 40,
    };
  } else if (lastCall && methodNames.has(lastCall)) {
    boosts = {
      Filter: 90,
      Delay: 80,
      Distortion: 70,
      Envelope: 60,
      Miscellaneous: 50,
      Node: 40,
      Setters: 30,
    };
  } else {
    // after a selector: __("#id").
    boosts = {
      Setters: 100,
      Control: 90,
      Filter: 60,
      Delay: 50,
      Distortion: 40,
      Envelope: 30,
      Connect: 20,
    };
  }
  const options = methodsOfTypes(CHAIN_METHODS, boosts);
  // end of chain
  const dac = options.find((o) => o.label === 'dac');
  if (dac && lastCall) dac.boost = 95;
  // sources can't sensibly start mid-chain, but they can (e.g. a modulator), so keep them, just lower
  return options;
}

/** Keys for the params object of `method`, minus those already present. */
export function keyCompletions(method, used = []) {
  const keys = (argCompletions[method] || [])
    .filter((a) => a.label.includes('.'))
    .map((a) => ({
      key: a.label.split('.').pop(),
      type: a.type,
      detail: a.detail,
      value: a.defaultValue,
    }));
  const all = [
    ...keys,
    ...COMMON_KEYS.filter((c) => !keys.some((k) => k.key === c.key)),
  ];

  return all
    .filter(({ key }) => !used.includes(key))
    .map(({ key, type, detail, value }, i) => {
      const common =
        COMMON_KEYS.some((c) => c.key === key) &&
        !keys.some((k) => k.key === key);
      const defaultValue = EXPLICIT_VALUES[key]?.[0] ?? value ?? '';
      return {
        label: key,
        type: 'property',
        detail: type,
        info: detail,
        boost: common ? -10 : 50 - i,
        apply: snippet(`${key}: \${${defaultValue}},`),
      };
    });
}

/** Values for `key` in `method`'s params object. */
export function valueCompletions(method, key) {
  const def = (argCompletions[method] || []).find(
    (a) => a.label.split('.').pop() === key
  );
  const values = [...(EXPLICIT_VALUES[key] || [])];
  if (def?.type === 'Boolean') values.push('true', 'false');
  return values.map((value, i) => ({
    label: value,
    type: 'variable',
    boost: 10 - i,
  }));
}

/** `__` and `this` at the start of an expression. */
export function rootCompletions() {
  return [
    {
      label: '__',
      type: 'namespace',
      detail: 'cracked',
      info: 'Start a signal chain: __().sampler() creates a node, __("#id") selects existing ones',
      boost: 10,
      apply: applySnippet('__("${}")'),
    },
    {
      label: 'this',
      type: 'keyword',
      detail: 'track',
      info: 'The track this script belongs to',
    },
  ];
}

// ---- selectors ----------------------------------------------------------------------------

const TRACK_CLASS = /^\.track-/;
const UUID_LIKE = /^[0-9a-f]{8}-?[0-9a-f]{4}/i;

const nodeTypes = supportedAudioNodes.filter((n) => methodNames.has(n));

// `{ id: 'bass', class: 'drums, loud' }` declared anywhere in the script text
function selectorsDeclaredIn(doc) {
  const ids = new Set();
  const classes = new Set();
  for (const m of doc.matchAll(/\bid\s*:\s*(['"`])([^'"`]+)\1/g))
    ids.add(`#${m[2].trim()}`);
  for (const m of doc.matchAll(/\bclass\s*:\s*(['"`])([^'"`]+)\1/g)) {
    m[2].split(',').forEach((c) => c.trim() && classes.add(`.${c.trim()}`));
  }
  return { ids, classes };
}

// node types the script has already created, e.g. `.sine(` or `.lowpass(`
function typesCreatedIn(doc) {
  const used = new Set();
  for (const m of doc.matchAll(/\.\s*([a-zA-Z_]\w*)\s*\(/g)) {
    if (nodeTypes.includes(m[1])) used.add(m[1]);
  }
  return used;
}

/**
 * Selector suggestions for `__("|")`, most useful first:
 * ids you gave your nodes, then classes, then node types already in use, then other types.
 * Ids and classes come from the text of the script as well as cracked's live lookup, so those
 * created by the init script are offered while writing the onstep script.
 */
export function selectorCompletions(doc) {
  const { ids, classes } = selectorsDeclaredIn(doc);
  const live = getSelectorLookupKeys().filter(
    (k) =>
      k !== '*' &&
      !k.includes(' ') &&
      !TRACK_CLASS.test(k) &&
      !UUID_LIKE.test(k)
  );
  live.forEach((k) => {
    if (k.startsWith('#')) ids.add(k);
    else if (k.startsWith('.')) classes.add(k);
  });
  const usedTypes = typesCreatedIn(doc);
  live.forEach((k) => nodeTypes.includes(k) && usedTypes.add(k));

  const options = [];
  ids.forEach((label) =>
    options.push({ label, type: 'variable', detail: 'id', boost: 100 })
  );
  classes.forEach((label) =>
    options.push({ label, type: 'class', detail: 'class', boost: 90 })
  );
  nodeTypes.forEach((label) =>
    options.push({
      label,
      type: 'type',
      detail: usedTypes.has(label) ? 'node in this track' : 'node type',
      boost: usedTypes.has(label) ? 80 : 0,
    })
  );
  return options;
}
