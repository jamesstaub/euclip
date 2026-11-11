/**
 * Descriptions for everything a track script can reach through `this`
 * (the object returned by `scriptScope` in models/track.ts).
 *
 * This is the single place the editor autocomplete reads from. When you add, rename or remove
 * a property on `scriptScope`, update this list too. In development a console warning is
 * logged for any `scriptScope` key that is missing here (see `warnUndocumentedScopeKeys`).
 *
 *   name         key on `this`
 *   kind         'method' is completed as `name()`, 'property' as plain `name`
 *   description  shown in the autocomplete popup
 *   example      optional code sample shown under the description
 *   boost        optional ranking in the menu; higher is listed first
 */
export const SCRIPT_SCOPE_DOCS = [
  {
    name: 'select',
    kind: 'method',
    description:
      'Select nodes belonging to this track. The selector is scoped to the track, so this.select("lowpass") only matches this track’s lowpass nodes.',
    example: 'this.select("lowpass").frequency(200);',
    boost: 10,
  },
  {
    name: 'selector',
    kind: 'method',
    description:
      'The track-scoped selector for a node type, as a string: what this.select(type) selects, for places that take a selector, like .connect(). Prefer it to an id (#name), which matches nodes in every track, so it breaks when a track is duplicated.',
    example: "__().sampler().connect(this.selector('gain'));",
    boost: 8,
  },
  {
    name: 'play',
    kind: 'method',
    description:
      'Trigger this track: restarts its source nodes and fires its ADSR envelopes. Optional attrs are applied to the source nodes.',
    example: 'this.play({ speed: 2 });',
    boost: 9,
  },
  {
    name: 'stop',
    kind: 'method',
    description: 'Stop all of this track’s source nodes.',
  },
  {
    name: 'filepath',
    kind: 'property',
    description:
      'URL of the first sound file chosen in the file picker. Pass it as `path` to a sampler.',
    example: '__().sampler({ path: this.filepath })',
    boost: 8,
  },
  {
    name: 'files',
    kind: 'property',
    description:
      'Array of every sound file URL for this track, e.g. one per sampler of a multi-sample kit.',
    example: '__().sampler({ path: this.files[0] })',
    boost: 7,
  },
  {
    name: 'state',
    kind: 'property',
    description:
      'An object that keeps its values from one step to the next (the rest of `this` is rebuilt every step). It starts empty each time the audio is built, i.e. on every play. Use it to decide something once, such as a shuffled order for the bar, and keep it.',
    example: 'if (index === 0) this.state.order = __.shuffle(__.fill_array(8, (i) => i));',
  },
  {
    name: 'bar',
    kind: 'property',
    description:
      'Which pass through this track’s sequence this is: 0 on the first, then 1, 2, … Use it to vary what plays from one loop to the next.',
    example: 'const flip = this.bar % 2 === 1;',
  },
  {
    name: 'declareControls',
    kind: 'method',
    description:
      'Adjusts how a macro’s settings are controlled in the UI (range, step, default, label). Call it in the setup script; the Macros menu has a documented example.',
    example: "this.declareControls('polysynth', { lp_frequency: { min: 200, max: 8000 } })",
  },
  {
    name: 'controls',
    kind: 'property',
    description:
      'Live values of this track’s controls, by node type (or index, or an id you gave the node; an id is also a selector for the whole page, so prefer the type). Reading gives the slider’s value (native units, current step for multisliders); assigning sets a one-step offset that is applied to the audio only for this step and never changes the slider. A node id that is also an array method (e.g. \'filter\') still addresses the node. A sampler also has sliceCount and slices (read-only) and the startSlice / endSlice controls, which pick a region of the sample by its onset slices.',
    example:
      'this.controls.lead.frequency = this.controls.lead.frequency * (1 + Math.random() * 0.02)',
    boost: 6,
  },
  {
    name: 'sliders',
    kind: 'property',
    description: 'Control data for this track’s sliders.',
  },
  {
    name: 'sequences',
    kind: 'property',
    description:
      'Every sequence, primary first. Each is its steps as an array (read sequences[0][index], .length, .map...; sequences[0][i] = 2 writes a step) with the sequencer’s own settings as properties: hits, steps, offset (the euclidean dials), kind, value, onSteps, offSteps, times, rate and maxValue. Setting one moves that dial in the sequencer menu and changes the pattern from the next step on. The methods euclidean(hits, steps, offset), binary(value), onOff(on, off, times) switch the generator, set(steps) replaces every step, and setting length resizes the hand-made steps.',
    example: 'this.sequences[0].euclidean(5, 8, 2);',
  },
  {
    name: 'euclidean',
    kind: 'method',
    description:
      'The sequencer’s euclidean generator as a plain function: euclidean(hits, steps, offset) returns an array of steps, without changing the sequencer. Hand them to a sequence with set().',
    example: 'this.sequences[0].set(this.euclidean(3, 8));',
  },
  {
    name: 'binary',
    kind: 'method',
    description:
      'The sequencer’s binary generator as a plain function: binary(value) returns the digits of a number (0 to 127) as steps.',
    example: 'this.sequences[0].set(this.binary(37));',
  },
  {
    name: 'onOff',
    kind: 'method',
    description:
      'The sequencer’s on/off generator as a plain function: onOff(on, off, times) returns `on` hits then `off` rests, `times` times over.',
    example: 'this.sequences[0].set(this.onOff(3, 2, 2));',
  },
  {
    name: 'setStep',
    kind: 'method',
    description:
      'Write a step of a sequence from the script: setStep(index, value, sequenceIndex = 0). The value is kept between 0 (a rest) and the sequence’s highest step value, and the index wraps around the sequence. The next time the sequence reaches that step, `data` is the new value, and the sequencer shows it. The steps become hand-made (like clicked steps).',
    example: 'this.setStep(index + 1, __.random(0, 4));',
  },
  {
    name: 'stepMs',
    kind: 'property',
    description:
      'Length of one tick of the project’s clock in milliseconds, derived from the bpm. A sequence with a faster or slower clock rate steps every stepMs / rate.',
  },
  {
    name: 'trackSelector',
    kind: 'property',
    description:
      'Class selector unique to this track, e.g. ".track-1". Added to every node the track creates.',
  },
  {
    name: 'id',
    kind: 'property',
    description: 'Id of this track.',
  },
  {
    name: 'playSourceNodes',
    kind: 'method',
    description:
      'Restart all of this track’s source nodes, optionally applying attrs.',
    example: 'this.playSourceNodes({ speed: 0.5 });',
  },
  {
    name: 'playSourceNode',
    kind: 'method',
    description:
      'Restart only the n-th source node, e.g. one sampler of a multi-sample kit. Optionally applies attrs.',
    example: 'this.playSourceNode(2);',
  },
  {
    name: 'playADSRNodes',
    kind: 'method',
    description: 'Trigger the ADSR envelopes of this track.',
  },
];

const documented = new Set(SCRIPT_SCOPE_DOCS.map((d) => d.name));
let warned = false;

/** Dev-time check that every key of `scriptScope` has an entry in SCRIPT_SCOPE_DOCS. */
export function warnUndocumentedScopeKeys(scope) {
  if (warned) return;
  const missing = Object.keys(scope).filter((key) => !documented.has(key));
  if (missing.length) {
    warned = true;
    // eslint-disable-next-line no-console
    console.warn(
      `scriptScope has no autocomplete docs for: ${missing.join(
        ', '
      )}. Add them to utils/script-scope-docs.js`
    );
  }
}
