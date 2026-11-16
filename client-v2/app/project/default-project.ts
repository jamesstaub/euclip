import pkg from 'cracked-up/package.json';
import { applyOperation } from 'client-v2/project/operations';
import {
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
  return `// Chain
__()
  .sampler({ id: 'sampler', buffer: '${buffer}' })
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

/** The sliced loop's starting pattern: a step's value is the slice it plays (0 is a rest). */
export const SLICED_LOOP_STEPS: readonly number[] = [
  1, 0, 3, 3, 5, 0, 7, 8, 9, 0, 3, 12, 13, 14, 0, 16,
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

/** What New Track adds: sampler into gain into `channel`, one 16-step sequence, and controls for them. */
export function newTrack(name: string, buffer = 'kick'): TrackDocument {
  return withPattern(
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
  );
}

const FILTER_CONTROLS = `slider('#filter', 'frequency');
slider('#filter', 'q');
knob('#level', 'gain', { label: 'level' });
slider('#sampler', 'speed');
waveform('#sampler');`;

/**
 * A track that plays slices of a loop: each step's value says which slice (1 is the first; 0 is a
 * rest). The slices are the sound's: cut it differently in the source pane and the same steps play the
 * new pieces. Its speed is synced to the sequence, so the loop stays in time when the tempo changes.
 */
export function slicedLoopScript(buffer: string = LOOP_SAMPLE): string {
  return `// Chain
__()
  .sampler({ id: 'sampler', buffer: '${buffer}' })
  .gain({ id: 'level', gain: 0.8 })
  .to('channel');

// Sequences: a step's value is the slice it plays (0 is a rest)
__.transport.sequence(
  'slices',
  { steps: 16, step: '1/8' },
  (ev) => {
    if (ev.value) __('#sampler').trigger({ slice: ev.value - 1 });
  },
);

// Controls
stepGrid('slices');
knob('#level', 'gain', { label: 'level' });
slider('#sampler', 'speed', { mode: 'sequence-sync' });
waveform('#sampler');
`;
}

/** What "Sliced loop" in the New Track menu adds. */
export function newSlicedLoopTrack(name: string): TrackDocument {
  return withPattern(
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
  );
}

function track(
  id: string,
  name: string,
  steps: readonly number[],
  chain: string,
): TrackDocument {
  return withPattern(
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
