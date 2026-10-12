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
    example: 'this.select("#bass").frequency(200);',
    boost: 10,
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
      'Array of every sound file URL for this track, e.g. one per pad of a multi-sample kit.',
    example: '__().sampler({ path: this.files[0] })',
    boost: 7,
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
      'Live values of this track’s controls, by node id or type (or index). Reading gives the slider’s value (native units, current step for multisliders); assigning sets a one-step offset that is applied to the audio only for this step and never changes the slider. A node id that is also an array method (e.g. \'filter\') still addresses the node.',
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
      'Every sequence’s steps as an array of arrays, primary sequence first.',
    example: 'this.sequences[0][index]',
  },
  {
    name: 'stepMs',
    kind: 'property',
    description:
      'Length of one sequencer step in milliseconds, derived from the project’s bpm.',
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
      'Restart only the n-th source node, e.g. one pad of a multi-sample kit. Optionally applies attrs.',
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
