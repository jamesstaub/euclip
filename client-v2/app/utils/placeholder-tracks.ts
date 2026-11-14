/** A track as the static shell draws it. The real document store replaces this. */
export interface TrackPlaceholder {
  /** stable key for view state and scripts */
  id: string;
  /** position in the list, shown at the start of the row */
  order: number;
  /** what the source button says: a sample's file name, an oscillator... */
  source: string;
  /** one value per step; 0 is off. Absent for the main output */
  steps?: readonly number[];
  /** the step being played, if any */
  current?: number;
  /** the main output: no source or sequence; the script it shows is the project script */
  output?: boolean;
  /** the track's script as first loaded. Absent for the main output */
  script?: string;
}

/** The id the project script is stored and shown under. */
export const PROJECT_ID = 'project';

/** The names scripts can use for loaded sounds (`buffer: 'kick'`), as the editors' catalog offers them. */
export const BUFFERS = ['kick', 'snare', 'hat'] as const;

const KICK = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
const SNARE = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1];
const HAT = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1];

/** A sampler track's script in the conventional order: the chain, then its sequences. */
function samplerScript(
  name: string,
  steps: readonly number[],
  chain: string,
): string {
  return `// Chain
__()
  .sampler({ id: '${name}', buffer: '${name}' })
${chain}
  .to('drums');

// Sequences
__.transport.sequence(
  '${name}',
  { steps: [${steps.join(', ')}], step: '1/16' },
  (ev) => {
    if (ev.value) __('#${name}').trigger();
  },
);
`;
}

/** The project script: the buses tracks send to, and the master chain. */
export const PROJECT_SCRIPT = `// Buses the tracks send to
__.bus('drums')
  .compressor({ id: 'glue', threshold: -18, ratio: 3 });

// Master
__.bus('main').gain.set(0.8);
`;

// Three sampler tracks with 16 steps each, then the main output.
export const TRACKS: readonly TrackPlaceholder[] = [
  {
    id: 'track-1',
    order: 1,
    source: 'BD0000.mp3',
    steps: KICK,
    current: 4,
    script: samplerScript(
      'kick',
      KICK,
      `  .lowpass({ id: 'kick-filter', frequency: 2000, q: 6 })
  .gain({ id: 'kick-level', gain: 0.8 })`,
    ),
  },
  {
    id: 'track-2',
    order: 2,
    source: 'SD0010.mp3',
    steps: SNARE,
    current: 4,
    script: samplerScript(
      'snare',
      SNARE,
      `  .highpass({ id: 'snare-filter', frequency: 180 })
  .gain({ id: 'snare-level', gain: 0.7 })`,
    ),
  },
  {
    id: 'track-3',
    order: 3,
    source: 'CH.mp3',
    steps: HAT,
    current: 4,
    script: samplerScript(
      'hat',
      HAT,
      `  .highpass({ id: 'hat-filter', frequency: 6000 })
  .gain({ id: 'hat-level', gain: 0.4 })`,
    ),
  },
  { id: 'main-output', order: 4, source: 'Main Output', output: true },
];

/** Every script of the placeholder project by id, project script included. */
export function initialScripts(): Record<string, string> {
  const scripts: Record<string, string> = { [PROJECT_ID]: PROJECT_SCRIPT };
  for (const track of TRACKS) {
    if (track.script !== undefined) scripts[track.id] = track.script;
  }
  return scripts;
}

export function trackName(track: TrackPlaceholder): string {
  return track.output ? 'Main output' : `Track ${track.order}`;
}
