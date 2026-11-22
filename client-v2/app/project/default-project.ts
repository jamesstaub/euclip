import pkg from 'cracked-up/package.json';
import { BUFFER_OPTION } from 'client-v2/controls/declarations';
import { noteToHz } from 'client-v2/controls/modes';
import { applyOperation } from 'client-v2/project/operations';
import {
  controlKey,
  emptyValues,
  stepGridKey,
  LOOP_SAMPLE,
  LOOP_SLICES,
  SCHEMA_VERSION,
  type ProjectDocument,
  type TrackDocument,
} from 'client-v2/project/schema';

/** The built-in sounds, served from public/samples (made by scripts/make-samples.mjs). */
export const BUILT_IN_SAMPLES = [
  'kick',
  'snare',
  'hat',
  'openhat',
  'clap',
  LOOP_SAMPLE,
] as const;

/**
 * A sampler track's script in the conventional order: the chain, its sequences, then the controls it
 * declares.
 *
 * Every track's chain ends at `channel`: a bus Euclip makes for the track, routed to `main`, whose
 * level and pan are the channel strip's. A script may ignore it and send its sound somewhere else (the
 * channel strip then says it has nothing to do).
 *
 * A control exists because the script declares it. The numbers in the chain are the defaults; what is
 * set on the controls is kept in the project. The sequence is made with a count of steps and no
 * pattern: its step grid owns the pattern, which is kept in the project like any control's value.
 */
export function samplerScript(
  buffer: string,
  steps = 16,
  chain = "  .gain({ id: 'level', gain: 0.8 })",
  controls = "knob('#level', 'gain', { label: 'level' });\nslider('#sampler', 'speed');\nwaveform('#sampler');",
): string {
  void buffer; // (the sound is the project's to hold, not the script's to name: see `withSound`)
  return `// Chain
__()
  .sampler({ id: 'sampler' })
${chain}
  .to('channel');

// Sequences
__.transport.sequence(
  'steps',
  { steps: ${steps}, step: '1/16' },
  (ev) => {
    if (ev.value) __('#sampler').trigger();
  },
);

// Controls
stepGrid('steps');
${controls}
`;
}

/** The project script of a new project: one insert on the main bus, its controls, and the master level. */
export const DEFAULT_PROJECT_SCRIPT = `// Master: every track's \`channel\` arrives at main
__.bus('main')
  .compressor({ id: 'glue', threshold: -18, ratio: 3 });

// Controls
slider(__.bus('main'), 'gain', { label: 'master', default: 0.8 });
slider('#glue', 'threshold');
slider('#glue', 'ratio');
`;

/** A random id for a new track. Not derived from the name or position: those change. */
export function newTrackId(): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `t-${random}`;
}

const ONE = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

/**
 * The sliced loop's starting pattern: which steps play, and which slice each plays (its `slice` lane;
 * null where the step is off).
 */
export const SLICED_LOOP_STEPS: readonly number[] = [
  1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1,
];
export const SLICED_LOOP_SLICES: readonly (number | null)[] = [
  1,
  null,
  3,
  3,
  5,
  null,
  7,
  8,
  9,
  null,
  3,
  12,
  13,
  14,
  null,
  16,
];

/**
 * A track with a pattern set on one of its step grids: as if the person had set those steps, by the
 * operation the grid itself applies (so the key and the shape are the store's own).
 */
export function withPattern(
  track: TrackDocument,
  sequence: string,
  steps: readonly number[],
): TrackDocument {
  const doc: ProjectDocument = {
    schemaVersion: SCHEMA_VERSION,
    name: '',
    bpm: 120,
    crackedUpVersion: pkg.version,
    script: '',
    values: emptyValues(),
    tracks: [track],
    samples: {},
  };
  return applyOperation(doc, {
    type: 'setControlValue',
    scope: track.id,
    key: stepGridKey(sequence),
    value: [...steps],
  }).tracks[0]!;
}

/**
 * A track with a control's lane set: the values steps hold of their own (null: the step follows the
 * control), and the control's single value where given. As if the person had painted them, by the
 * operations the lane and the control apply.
 */
export function withLane(
  track: TrackDocument,
  key: string,
  stepValues: readonly (number | null)[],
  value?: number,
): TrackDocument {
  let doc: ProjectDocument = {
    schemaVersion: SCHEMA_VERSION,
    name: '',
    bpm: 120,
    crackedUpVersion: pkg.version,
    script: '',
    values: emptyValues(),
    tracks: [track],
    samples: {},
  };
  if (value !== undefined) {
    doc = applyOperation(doc, {
      type: 'setControlValue',
      scope: track.id,
      key,
      value,
    });
  }
  return applyOperation(doc, {
    type: 'setControlOptions',
    scope: track.id,
    key,
    options: { stepValues: [...stepValues] },
  }).tracks[0]!;
}

/**
 * A track whose sampler has been given a sound: as if the person had chosen it (Use, or the source
 * pane's picker), by the operation that does. The templates' scripts name no sound: which sound a
 * sampler plays is kept in the project, as its pattern is, so the browser's Use never contradicts what
 * the script says. (A script may still write `buffer: 'kick'`: that is then the default.)
 */
export function withSound(
  track: TrackDocument,
  sound: string,
  selector = '#sampler',
): TrackDocument {
  const doc: ProjectDocument = {
    schemaVersion: SCHEMA_VERSION,
    name: '',
    bpm: 120,
    crackedUpVersion: pkg.version,
    script: '',
    values: emptyValues(),
    tracks: [track],
    samples: {},
  };
  return applyOperation(doc, {
    type: 'setControlValue',
    scope: track.id,
    key: controlKey(selector, BUFFER_OPTION),
    value: sound,
  }).tracks[0]!;
}

/** What New Track adds: sampler into gain into `channel`, one 16-step sequence, and controls for them. */
export function newTrack(name: string, buffer = 'kick'): TrackDocument {
  return withSound(
    withPattern(
      {
        id: newTrackId(),
        name,
        script: samplerScript(buffer),
        level: 1,
        pan: 0,
        values: emptyValues(),
      },
      'steps',
      ONE,
    ),
    buffer,
  );
}

const FILTER_CONTROLS = `slider('#filter', 'frequency');
slider('#filter', 'q');
knob('#level', 'gain', { label: 'level' });
slider('#sampler', 'speed');
waveform('#sampler');`;

/**
 * A track that plays slices of a loop: the steps say when, the sampler's `slice` lane says which slice
 * (1 is the first; 0 the whole region). The slices are the sound's: cut it differently in the source
 * pane and the same steps play the new pieces. Its speed is synced to the sequence, so the loop stays
 * in time when the tempo changes.
 */
export function slicedLoopScript(buffer: string = LOOP_SAMPLE): string {
  void buffer;
  return `// Chain
__()
  .sampler({ id: 'sampler' })
  .gain({ id: 'level', gain: 0.8 })
  .to('channel');

// Sequences: a step that is on plays; its slice is the sampler's slice on that step
__.transport.sequence(
  'slices',
  { steps: 16, step: '1/8' },
  (ev) => {
    if (ev.value) __('#sampler').trigger();
  },
);

// Controls
stepGrid('slices');
knob('#level', 'gain', { label: 'level' });
slider('#sampler', 'speed', { mode: 'sequence-sync' });
slider('#sampler', 'slice', { max: 16 });
waveform('#sampler');
`;
}

/** What "Sliced loop" in the New Track menu adds. */
export function newSlicedLoopTrack(name: string): TrackDocument {
  return withSound(
    withLane(
      withPattern(
        {
          id: newTrackId(),
          name,
          script: slicedLoopScript(),
          level: 1,
          pan: 0,
          values: emptyValues(),
        },
        'slices',
        SLICED_LOOP_STEPS,
      ),
      '#sampler › slice',
      SLICED_LOOP_SLICES,
    ),
    LOOP_SAMPLE,
  );
}

/**
 * A synth track: a `monosynth` (the library's one-voice synth: an oscillator through a lowpass and an
 * envelope) played by a 16-step sequence. A step that is on triggers it; the note is its `frequency`
 * parameter, which the keyboard sets and whose lane holds the melody (a step with a pitch of its own
 * plays that, the others the keyboard's). The macro is gated: its envelope is closed until triggered,
 * so its output (and the scope on it) is silent between notes. Its exposed parameters (cutoff,
 * resonance, envelope, level) are the controls a synth needs, with no ids to wire. The pattern and the
 * melody are the grid's and the lane's, stored like the others'.
 */
export const SYNTH_SCRIPT = `// Chain
__()
  .monosynth({ id: 'synth', cutoff: 1400, gain: 0.3 })
  .to('channel');

// Sequences: a step that is on plays the synth's pitch on that step
__.transport.sequence(
  'steps',
  { steps: 16, step: '1/16' },
  (ev) => {
    if (ev.value) __('#synth').trigger({ duration: 0.12 });
  },
);

// Controls
stepGrid('steps');
synth('#synth');
slider('#synth', 'cutoff');
slider('#synth', 'resonance');
slider('#synth', 'attack');
slider('#synth', 'release');
slider('#synth', 'gain', { label: 'level' });
`;

/** The synth's starting pattern: which steps play. */
export const SYNTH_STEPS: readonly number[] = [
  1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0,
];

/** The key of the synth's pitch: the control `synth('#synth')` makes for the keyboard. */
export const SYNTH_PITCH = '#synth › frequency';

/**
 * Its melody, a bass figure in C minor: the keyboard's pitch is C2, and the steps that play another
 * note hold it (G2, D#2, F2), in Hz as the pitch is.
 */
export const SYNTH_PITCH_VALUE = noteToHz(36);
export const SYNTH_MELODY: readonly (number | null)[] = [
  null,
  null,
  null,
  null,
  null,
  null,
  noteToHz(43),
  null,
  null,
  null,
  null,
  noteToHz(39),
  null,
  noteToHz(41),
  null,
  null,
];

/** What "Synth" in the New Track menu adds. */
export function newSynthTrack(name: string): TrackDocument {
  return withLane(
    withPattern(
      {
        id: newTrackId(),
        name,
        script: SYNTH_SCRIPT,
        level: 1,
        pan: 0,
        values: emptyValues(),
      },
      'steps',
      SYNTH_STEPS,
    ),
    SYNTH_PITCH,
    SYNTH_MELODY,
    SYNTH_PITCH_VALUE,
  );
}

function track(
  id: string,
  name: string,
  steps: readonly number[],
  chain: string,
): TrackDocument {
  return withSound(
    withPattern(
      {
        id,
        name,
        script: samplerScript(name, steps.length, chain, FILTER_CONTROLS),
        level: 1,
        pan: 0,
        values: emptyValues(),
      },
      'steps',
      steps,
    ),
    name,
  );
}

/** The project a person starts with when nothing is saved: three drum tracks that play. */
export function defaultProject(): ProjectDocument {
  return {
    schemaVersion: SCHEMA_VERSION,
    name: 'Untitled project',
    bpm: 120,
    crackedUpVersion: pkg.version,
    script: DEFAULT_PROJECT_SCRIPT,
    values: emptyValues(),
    tracks: [
      track(
        't-kick',
        'kick',
        [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
        `  .lowpass({ id: 'filter', frequency: 2000, q: 2 })
  .gain({ id: 'level', gain: 0.9 })`,
      ),
      track(
        't-snare',
        'snare',
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
        `  .highpass({ id: 'filter', frequency: 180, q: 1 })
  .gain({ id: 'level', gain: 0.7 })`,
      ),
      track(
        't-hat',
        'hat',
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
        `  .highpass({ id: 'filter', frequency: 6000, q: 1 })
  .gain({ id: 'level', gain: 0.4 })`,
      ),
    ],
    samples: Object.fromEntries(
      BUILT_IN_SAMPLES.map((name) => [
        name,
        name === LOOP_SAMPLE
          ? { url: `/samples/${name}.wav`, slices: [...LOOP_SLICES] }
          : { url: `/samples/${name}.wav` },
      ]),
    ),
  };
}
