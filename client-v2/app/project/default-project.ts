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
 * A sampler track's script in the conventional order: the chain, then its sequences.
 *
 * Every track's chain ends at `out`: a bus Euclip makes in the track's scope, routed to `main`, whose
 * level and pan are the channel strip's. A script may ignore it and send its sound somewhere else.
 */
export function samplerScript(
  buffer: string,
  steps: readonly number[],
  chain = "  .gain({ id: 'level', gain: 0.8 })",
): string {
  return `// Chain
__()
  .sampler({ id: 'sampler', buffer: '${buffer}' })
${chain}
  .to('out');

// Sequences
__.transport.sequence(
  'steps',
  { steps: [${steps.join(', ')}], step: '1/16' },
  (ev) => {
    if (ev.value) __('#sampler').trigger();
  },
);
`;
}

/** The project script of a new project: one insert on the main bus, and the master level. */
export const DEFAULT_PROJECT_SCRIPT = `// Master: every track's \`out\` arrives at main
__.bus('main')
  .compressor({ id: 'glue', threshold: -18, ratio: 3 });

__.bus('main').gain.set(0.8);
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

/** What New Track adds: sampler into gain into `out`, with one 16-step sequence. */
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

function track(
  id: string,
  name: string,
  steps: readonly number[],
  chain: string,
): TrackDocument {
  return {
    id,
    name,
    script: samplerScript(name, steps, chain),
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
        `  .highpass({ id: 'filter', frequency: 180 })
  .gain({ id: 'level', gain: 0.7 })`,
      ),
      track(
        't-hat',
        'hat',
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
        `  .highpass({ id: 'filter', frequency: 6000 })
  .gain({ id: 'level', gain: 0.4 })`,
      ),
    ],
    samples: Object.fromEntries(
      BUILT_IN_SAMPLES.map((name) => [name, { url: `/samples/${name}.wav` }]),
    ),
  };
}
