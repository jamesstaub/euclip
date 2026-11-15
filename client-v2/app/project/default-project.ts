import pkg from 'cracked-up/package.json';
import {
  emptyValues,
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
] as const;

/**
 * A sampler track's script in the conventional order: the chain, its sequences, then the controls it
 * declares.
 *
 * Every track's chain ends at `channel`: a bus Euclip makes for the track, routed to `main`, whose
 * level and pan are the channel strip's. A script may ignore it and send its sound somewhere else (the
 * channel strip then says it has nothing to do).
 *
 * A control exists because the script declares it. The numbers in the chain and the steps in the
 * sequence are the defaults; what is set on the controls is kept in the project.
 */
export function samplerScript(
  buffer: string,
  steps: readonly number[],
  chain = "  .gain({ id: 'level', gain: 0.8 })",
  controls = "knob('#level', 'gain', { label: 'level' });\nslider('#sampler', 'speed');",
): string {
  return `// Chain
__()
  .sampler({ id: 'sampler', buffer: '${buffer}' })
${chain}
  .to('channel');

// Sequences
__.transport.sequence(
  'steps',
  { steps: [${steps.join(', ')}], step: '1/16' },
  (ev) => {
    if (ev.value) __('#sampler').trigger();
  },
);

// Controls
sequencer('steps');
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

/** What New Track adds: sampler into gain into `channel`, one 16-step sequence, and controls for them. */
export function newTrack(name: string, buffer = 'kick'): TrackDocument {
  return {
    id: newTrackId(),
    name,
    script: samplerScript(buffer, ONE),
    level: 1,
    pan: 0,
    values: emptyValues(),
  };
}

const FILTER_CONTROLS = `slider('#filter', 'frequency');
slider('#filter', 'q');
knob('#level', 'gain', { label: 'level' });
slider('#sampler', 'speed');`;

function track(
  id: string,
  name: string,
  steps: readonly number[],
  chain: string,
): TrackDocument {
  return {
    id,
    name,
    script: samplerScript(name, steps, chain, FILTER_CONTROLS),
    level: 1,
    pan: 0,
    values: emptyValues(),
  };
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
      BUILT_IN_SAMPLES.map((name) => [name, { url: `/samples/${name}.wav` }]),
    ),
  };
}
