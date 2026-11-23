import pkg from 'cracked-up/package.json';
import {
  DEFAULT_PROJECT_SCRIPT,
  builtInSamples,
  newSlicedLoopTrack,
  newSynthTrack,
  samplerScript,
  withLane,
  withPattern,
  withSound,
} from 'client-v2/project/default-project';
import {
  SCHEMA_VERSION,
  emptyValues,
  type ProjectDocument,
  type TrackDocument,
} from 'client-v2/project/schema';
import { STARTER_TEXTS, type StarterId } from 'client-v2/help/starters-text';

/**
 * The projects "New project" (and the welcome dialog) offer besides an empty one. Each is a document
 * made the way a person would have made it: a track from a template, a pattern set on its grid, a
 * lane painted. Nothing here is a special case the app knows about, so each is a project a person can
 * take apart. Every one builds with no script error (tests/unit/project/starters-test.ts).
 */
export interface Starter {
  id: StarterId;
  build(): ProjectDocument;
}

function project(
  id: StarterId,
  bpm: number,
  tracks: TrackDocument[],
): ProjectDocument {
  return {
    schemaVersion: SCHEMA_VERSION,
    name: STARTER_TEXTS[id].name,
    bpm,
    crackedUpVersion: pkg.version,
    script: DEFAULT_PROJECT_SCRIPT,
    values: emptyValues(),
    tracks,
    samples: builtInSamples(),
  };
}

/** A sampler track playing one built-in sound, with the pattern on its grid. */
function sampler(
  id: string,
  sound: string,
  steps: readonly number[],
  chain?: string,
  controls?: string,
): TrackDocument {
  return withSound(
    withPattern(
      {
        id,
        name: sound,
        script: samplerScript(sound, steps.length, chain, controls),
        level: 1,
        pan: 0,
        values: emptyValues(),
      },
      'steps',
      steps,
    ),
    sound,
  );
}

const FOUR_ON_THE_FLOOR = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];

function drumMachine(): ProjectDocument {
  return project('drum-machine', 120, [
    sampler('t-kick', 'kick', [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0]),
    sampler(
      't-snare',
      'snare',
      [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
    ),
    sampler(
      't-hat',
      'hat',
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
      "  .gain({ id: 'level', gain: 0.4 })",
    ),
    sampler(
      't-clap',
      'clap',
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      "  .gain({ id: 'level', gain: 0.6 })",
    ),
  ]);
}

function slicedBreak(): ProjectDocument {
  return project('sliced-break', 120, [
    { ...newSlicedLoopTrack('break'), id: 't-break' },
  ]);
}

/** The bass's filter, as a lane: a cutoff of its own on the steps that play. */
const CUTOFF_LANE: readonly (number | null)[] = [
  600,
  null,
  null,
  2400,
  null,
  null,
  1200,
  null,
  3200,
  null,
  null,
  900,
  null,
  2000,
  null,
  null,
];

function synthLine(): ProjectDocument {
  const bass = withLane(
    { ...newSynthTrack('bass'), id: 't-bass' },
    '#synth › cutoff',
    CUTOFF_LANE,
  );
  return project('synth-line', 110, [
    bass,
    sampler('t-kick', 'kick', FOUR_ON_THE_FLOOR),
  ]);
}

const ECHO_CHAIN = `  .lowpass({ id: 'filter', frequency: 8000, q: 1 })
  .tapedelay({ id: 'echo', time: 0.375, feedback: 0.45, mix: 0.3 })
  .reverb({ id: 'room', mix: 0.3 })
  .gain({ id: 'level', gain: 0.8 })`;

const ECHO_CONTROLS = `slider('#filter', 'frequency');
slider('#echo', 'mix');
slider('#echo', 'feedback');
slider('#room', 'mix');
knob('#level', 'gain', { label: 'level' });
waveform('#sampler');`;

function effectsChain(): ProjectDocument {
  const clap = sampler(
    't-clap',
    'clap',
    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0],
    ECHO_CHAIN,
    ECHO_CONTROLS,
  );
  // on single steps the filter closes and the echo opens: the tail of that hit is different
  const echo = withLane(clap, '#echo › mix', [
    null,
    null,
    null,
    null,
    0.15,
    null,
    null,
    null,
    null,
    null,
    null,
    0.6,
    0.8,
    null,
    null,
    null,
  ]);
  const filter = withLane(echo, '#filter › frequency', [
    null,
    null,
    null,
    null,
    6000,
    null,
    null,
    null,
    null,
    null,
    null,
    1800,
    3500,
    null,
    null,
    null,
  ]);
  return project('effects-chain', 118, [
    sampler('t-kick', 'kick', FOUR_ON_THE_FLOOR),
    filter,
  ]);
}

/** An empty project: no tracks, the project script's master section. */
export function emptyProject(): ProjectDocument {
  return {
    schemaVersion: SCHEMA_VERSION,
    name: 'Untitled project',
    bpm: 120,
    crackedUpVersion: pkg.version,
    script: DEFAULT_PROJECT_SCRIPT,
    values: emptyValues(),
    tracks: [],
    samples: builtInSamples(),
  };
}

export const STARTERS: readonly Starter[] = [
  { id: 'drum-machine', build: drumMachine },
  { id: 'sliced-break', build: slicedBreak },
  { id: 'synth-line', build: synthLine },
  { id: 'effects-chain', build: effectsChain },
];
