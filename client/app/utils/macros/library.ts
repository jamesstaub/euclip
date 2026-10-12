import { macroMarker, type MacroDefinition, type MacroSchema } from './schema';

const WAVEFORMS = ['sine', 'square', 'sawtooth', 'triangle'];

/**
 * The settings shared by cracked's polysynth and monosynth. Defaults match cracked's own, so a macro
 * made without any options sounds the same as it always did.
 */
const synthSchema: MacroSchema = {
  osc_type: { label: 'wave', role: 'timbre', type: 'choice', choices: WAVEFORMS, default: 0, description: 'Oscillator waveform.' },
  osc_detune: { label: 'detune', role: 'pitch', unit: 'Cents', min: -100, max: 100, step: 1, default: 0, description: 'Oscillator detune in cents.' },
  lp_frequency: { label: 'cutoff', role: 'filter', unit: 'Hz', min: 20, max: 20000, step: 1, scale: 'log', default: 440, description: 'Low-pass filter cutoff.' },
  lp_q: { label: 'resonance', role: 'filter', unit: 'Q', min: 0, max: 20, step: 0.1, default: 0, description: 'Low-pass filter resonance.' },
  adsr_envelope: { label: 'envelope', role: 'envelope', unit: 'Seconds', min: 0.05, max: 4, step: 0.05, default: 0.5, description: 'Total envelope time (split into attack, decay, release).' },
  lfo_type: { label: 'lfo wave', role: 'modulation', type: 'choice', choices: WAVEFORMS, default: 2, description: 'LFO waveform.' },
  lfo_speed: { label: 'lfo speed', role: 'modulation', unit: 'Hz', min: 0.1, max: 20, step: 0.1, default: 5, description: 'LFO frequency.' },
  lfo_intensity: { label: 'lfo depth', role: 'modulation', unit: 'Hz', min: 0, max: 100, step: 1, default: 0, description: 'How far the LFO moves the pitch.' },
  gain_volume: { label: 'volume', role: 'level', unit: 'Amplitude', min: 0, max: 1, step: 0.01, default: 1, description: 'Output level.' },
};

// A documented example for each macro, for the Macros menu. Each has two scripts: the macro's registration (added once
// to the project's macros script, where the schema is declared) and an example of using it in a track.

const POLYSYNTH_PROJECT = `${macroMarker('polysynth')}
/**
  POLYSYNTH CONTROLS

  euclip already knows how to control every polysynth setting (ranges, steps and defaults are built in).
  declareControls() changes how a setting is controlled in the UI, in every track of this project. It is the
  same format euclip uses itself, so it is a template for describing a macro of your own (see defineMacro).

  For each setting you may give:
    label     the text over the control
    role      what the setting is for: 'pitch' | 'level' | 'timbre' | 'filter' | 'envelope' | 'modulation'
              (UIs choose their widgets by role)
    min, max  the range of the control
    step      the smallest change
    scale     'linear' or 'log': how the slider maps to values. Frequencies feel right on 'log'
              (equal travel for every octave).
    default   the value the control starts at (used when it is first created; a number a track passes to
              polysynth() wins over it)
    type      'choice' makes the setting a pick from 'choices' (see osc_type)

  min, max, step and scale take effect every time this script runs. A track's own setup script can still
  call this.declareControls(...) to change them for just that track.
**/
this.declareControls('polysynth', {
  lp_frequency: { label: 'cutoff', role: 'filter', min: 200, max: 8000, step: 1, scale: 'log' },
  lp_q: { label: 'resonance', role: 'filter', min: 0, max: 12, step: 0.1 },
  osc_type: { type: 'choice', choices: ['sine', 'square', 'sawtooth', 'triangle'], role: 'timbre' },
});
`;

const POLYSYNTH_INIT = `/**
  POLYSYNTH: a polyphonic synth. Every note you play gets its own voice
  (oscillator + LFO + envelope + filter), so notes can overlap.

  What you pass to polysynth() are its starting settings. They also become
  controls in the Source tab, so you can change them while it plays, and the
  Play script can read and offset them (see this.controls in the Play script).
  How the controls look is declared once for the whole project, in the
  Macros tab of this editor.

  Settings (what the macro understands, with their defaults):
    osc_type       'sine' | 'square' | 'sawtooth' | 'triangle'    'sine'
    osc_detune     cents                                           0
    lp_frequency   low-pass cutoff in Hz                           440
    lp_q           low-pass resonance                              0
    adsr_envelope  envelope time in seconds                        0.5
    lfo_type       waveform of the pitch LFO                       'sawtooth'
    lfo_speed      LFO speed in Hz                                 5
    lfo_intensity  how far the LFO moves the pitch, in Hz          0
    gain_volume    output level, 0 to 1                            1
**/
__()
  .polysynth({
    osc_type: 'sawtooth',
    lp_frequency: 1800,
    lp_q: 2,
    adsr_envelope: 0.5,
    gain_volume: 0.6,
  })
  .channelStrip()
  .connect('#main-output');
`;

const POLYSYNTH_ONSTEP = `// A polysynth is played with noteOn and noteOff (no this.play() here).
// Each hit plays a note from a minor pentatonic scale; the step picks the note.
const scale = [0, 3, 5, 7, 10]; // semitones above the root
const root = 48; // MIDI note number (C3)

if (data) {
  const pitch = root + scale[index % scale.length] + 12 * (index % 2);

  // Select the synth right before every call (cracked's selection is shared state).
  this.select('polysynth').polysynth('noteOn', { pitch, velocity: 100, envelope: [0.01, 0.1, 0.5] });

  // release before the next step so voices don't pile up (this.stepMs is the length of a step)
  setTimeout(() => this.select('polysynth').polysynth('noteOff', { pitch }), this.stepMs * 0.8);
}

// The macro's settings are controls, so the script can read and offset them.
// Reading gives the control's value; assigning offsets it for this step only
// (the control keeps its value, and nothing builds up).
// Try it: open the filter a bit more on every hit.
//   this.controls.polysynth.lp_frequency *= 1.5;
`;

const MONOSYNTH_PROJECT = `${macroMarker('monosynth')}
/**
  MONOSYNTH CONTROLS: see the polysynth block (or the Macros menu's Polysynth example) for every field.
  Here the cutoff is limited to a bass-friendly range, for every track in the project.
**/
this.declareControls('monosynth', {
  lp_frequency: { label: 'cutoff', role: 'filter', min: 60, max: 3000, step: 1, scale: 'log' },
});
`;

const MONOSYNTH_INIT = `/**
  MONOSYNTH: a simple one-voice synth (oscillator, LFO, filter, envelope).
  It plays one note at a time: a new note takes over the oscillator.

  Its settings are the same as the polysynth's, plus:
    osc_frequency  the oscillator's pitch in Hz (the note played overrides it)   440

  The settings you pass become controls in the Source tab, and this.controls
  lets the Play script read and offset them. How the controls look is declared
  once for the whole project, in the Macros tab of this editor.
**/
__()
  .monosynth({
    osc_type: 'square',
    osc_frequency: 110,
    lp_frequency: 900,
    lp_q: 4,
    adsr_envelope: 0.4,
    gain_volume: 0.7,
  })
  .channelStrip()
  .connect('#main-output');

// Its oscillator makes no sound until it is started; the envelope keeps it silent until a note
// plays. this.select() limits this to this track (a polysynth starts its own voices, so it needs no start).
this.select('monosynth').start();
`;

const MONOSYNTH_ONSTEP = `// A monosynth is played with noteOn and noteOff too.
const line = [0, 0, 7, 5, 3, 0, 10, 7]; // semitones above the root
const root = 36; // MIDI note number (C2)

if (data) {
  const pitch = root + line[index % line.length];
  this.select('monosynth').monosynth('noteOn', { pitch, velocity: 100, envelope: [0.005, 0.1, 0.4] });
}

// Sweep the filter over the sequence around the cutoff control: one octave either way.
// The control keeps its value; the red ring on its slider shows where the sweep is.
const position = Math.sin((index / array.length) * 2 * Math.PI);
this.controls.monosynth.lp_frequency = this.controls.monosynth.lp_frequency * Math.pow(2, position);
`;

export const MACROS: MacroDefinition[] = [
  {
    key: 'polysynth',
    title: 'Polysynth',
    description: 'A polyphonic synth: every note you play gets its own voice (oscillator, LFO, envelope and filter).',
    schema: synthSchema,
    projectScript: POLYSYNTH_PROJECT,
    initScript: POLYSYNTH_INIT,
    onstepScript: POLYSYNTH_ONSTEP,
  },
  {
    key: 'monosynth',
    title: 'Monosynth',
    description: 'A one-voice synth with an oscillator, LFO, filter and envelope: bass lines and leads.',
    schema: {
      osc_frequency: { label: 'pitch', role: 'pitch', unit: 'Hz', min: 20, max: 2000, step: 1, scale: 'log', default: 440, description: 'Oscillator pitch.' },
      ...synthSchema,
    },
    projectScript: MONOSYNTH_PROJECT,
    initScript: MONOSYNTH_INIT,
    onstepScript: MONOSYNTH_ONSTEP,
  },
];

// ---- a template for a macro of your own ----

const SIREN_PROJECT = `${macroMarker('siren')}
/**
  DEFINING YOUR OWN MACRO

  defineMacro(name, definition) registers a macro for the whole project: after it, any track's script can
  use  __().siren({ ... })  and its settings are controls, just like a built-in macro's.

  The definition has:
    title     a name for the UI
    controls  the control schema: one entry per setting (see the Polysynth example for every field)
    create    create(settings) adds the macro's audio nodes. 'settings' is what the track passed to
              __().siren({...}) over the defaults in 'controls'. euclip wraps the nodes in the macro for you.
              (A choice setting arrives as its chosen string, e.g. 'sawtooth'.)
    update    update(changes, el) is called when a control changes (by the UI, or this.controls in a script):
              apply 'changes' to the macro's nodes. 'el' is the macro; el.search('osc') finds its inner nodes
              by type. Every setting in 'controls' should be handled here, or its control will do nothing.
    methods   optional: extra things a script can call, e.g. __('siren').siren('pitch', 60)
**/
this.defineMacro('siren', {
  title: 'Siren',
  controls: {
    wave: { type: 'choice', choices: ['sine', 'square', 'sawtooth', 'triangle'], default: 0, role: 'timbre' },
    rate: { label: 'wobble', role: 'modulation', unit: 'Hz', min: 0.1, max: 20, step: 0.1, default: 4 },
    depth: { label: 'depth', role: 'modulation', unit: 'Hz', min: 0, max: 400, step: 1, default: 60 },
    cutoff: { label: 'cutoff', role: 'filter', unit: 'Hz', min: 100, max: 8000, step: 1, scale: 'log', default: 2000 },
    volume: { label: 'volume', role: 'level', unit: 'Amplitude', min: 0, max: 1, step: 0.01, default: 0.5 },
  },

  create(settings) {
    // an LFO that wobbles the oscillator's pitch, then the oscillator, a filter and the output level
    __()
      .lfo({ type: 'sine', gain: settings.depth, frequency: settings.rate, modulates: 'frequency' })
      .osc({ type: settings.wave, frequency: 220 })
      .lowpass({ frequency: settings.cutoff })
      .gain({ gain: settings.volume });
  },

  update(changes, el) {
    if ('wave' in changes) __.exec('type', [changes.wave], el.search('osc'));
    if ('rate' in changes) __.exec('frequency', [changes.rate], el.search('lfo'));
    if ('depth' in changes) __.exec('volume', [changes.depth], el.search('lfo'));
    if ('cutoff' in changes) __.exec('frequency', [changes.cutoff], el.search('lowpass'));
    if ('volume' in changes) __.exec('volume', [changes.volume], el.search('gain'));
  },

  methods: {
    // __('siren').siren('pitch', 60): play a MIDI note
    pitch(note, el) {
      __.exec('frequency', [__.pitch2freq(note)], el.search('osc'));
    },
  },
});
`;

const SIREN_INIT = `/**
  A track using the "siren" macro that the project's macros script defines
  (open the Macros tab to see the definition, which is what the Siren template added).
  The settings you pass become controls in the Source tab.
**/
__()
  .siren({
    wave: 'sawtooth',
    rate: 6,
    depth: 80,
    cutoff: 1500,
  })
  .channelStrip()
  .connect('#main-output');

// The macro's oscillator makes no sound until it is started.
this.select('siren').start();
`;

const SIREN_ONSTEP = `// Step through a few notes with the macro's own 'pitch' method, and sweep the wobble speed
// around the control: reading this.controls gives its value, assigning offsets it for this step only.
const notes = [57, 60, 64, 67];
this.select('siren').siren('pitch', notes[index % notes.length]);

const sweep = 1 + 0.5 * Math.sin((index / array.length) * 2 * Math.PI);
this.controls.siren.rate = this.controls.siren.rate * sweep;
`;

/**
 * Macros the menu offers that are not built in: a worked example of defining one. Not in MACROS, because there
 * is nothing built in to describe until a project's macros script defines it.
 */
export const MACRO_TEMPLATES: MacroDefinition[] = [
  {
    key: 'siren',
    title: 'Define your own macro (Siren)',
    description:
      'A worked example of defineMacro: a wobbling oscillator with its own controls. Shows how a macro is registered once for the project and then used by name.',
    schema: {
      wave: { label: 'wave', type: 'choice', choices: ['sine', 'square', 'sawtooth', 'triangle'], default: 0 },
      rate: { label: 'wobble', unit: 'Hz', min: 0.1, max: 20, step: 0.1, default: 4 },
      depth: { label: 'depth', unit: 'Hz', min: 0, max: 400, step: 1, default: 60 },
      cutoff: { label: 'cutoff', unit: 'Hz', min: 100, max: 8000, step: 1, scale: 'log', default: 2000 },
      volume: { label: 'volume', unit: 'Amplitude', min: 0, max: 1, step: 0.01, default: 0.5 },
    },
    projectScript: SIREN_PROJECT,
    initScript: SIREN_INIT,
    onstepScript: SIREN_ONSTEP,
  },
];

/** Every example the Macros menu lists: the built-in macros, then the templates. */
export const MACRO_EXAMPLES: MacroDefinition[] = [...MACROS, ...MACRO_TEMPLATES];

export const macroExampleByKey = (key: string): MacroDefinition | undefined =>
  MACRO_EXAMPLES.find((macro) => macro.key === key);

// Macros the open project defined itself, in its macros script (`this.defineMacro(...)`). They live only as long as
// that script's last run; the project script re-registers them on every build.
const customMacros = new Map<string, MacroDefinition>();

export function registerCustomMacro(macro: MacroDefinition): void {
  customMacros.set(macro.key, macro);
}

export function clearCustomMacros(): void {
  customMacros.clear();
}

/** A built-in macro, by name. */
export const macroByKey = (key: string): MacroDefinition | undefined => MACROS.find((macro) => macro.key === key);

/** The control schema for a macro by name: the project's own definition first, else the built-in one. */
export const macroSchemaFor = (nodeType: string): MacroSchema | undefined =>
  customMacros.get(nodeType)?.schema ?? macroByKey(nodeType)?.schema;
