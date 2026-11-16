/**
 * The project document: everything a project is, as one plain JSON value.
 *
 * Structure lives in code and values live here. A script creates nodes, chains and sequences, and
 * declares the controls it wants (`slider('#filter', 'frequency')`, `stepGrid('steps')`). What the user
 * then sets on those controls is stored here, next to the script, and never rewrites it. How the project
 * is being looked at (which pane, script or UI) is not here: that belongs to the person and the device
 * (see services/view.ts).
 */

/** Bumped whenever the shape below changes in a way old documents need migrating for. */
export const SCHEMA_VERSION = 5;

/** A parameter's value, or a step grid's pattern. */
export type StoredValue = number | boolean | string | number[];

/** What is stored for one declared control. */
export interface ControlState {
  /**
   * The control's value: a parameter's value in its own unit, or a step grid's steps. Absent until the
   * control is first moved (and after a reset): what the script itself says (the number in the node,
   * the steps in the `transport.sequence` call) is then the value, and is the default.
   */
  value?: StoredValue;
  /** Settings the user has changed on the control itself. */
  options?: ControlUserOptions;
}

export interface ControlUserOptions {
  /** the slider mode the user chose (see controls/modes.ts); absent: the declared or default one */
  mode?: string;
  /** with the mode `sequence-sync`: the named sequence of the script the speed is synced to */
  sequence?: string;
  /** seconds the parameter takes to get to where the control is put; absent: the script's (default 0) */
  glide?: number;
}

/**
 * The values the user has set for what one script declares (a track's script, or the project script).
 */
export interface ScopeValues {
  /**
   * Declared controls by key (see `controlKey`, `stepGridKey`; a control of its own is keyed by its
   * name). An entry whose declaration is not in the script at the moment is kept, dormant, and applies
   * again if the declaration comes back.
   */
  controls: Record<string, ControlState>;
}

/** The key of a control bound to a parameter. The separator cannot appear in a parameter name. */
export function controlKey(selector: string, param: string): string {
  return `${selector} › ${param}`;
}

/** The key of the control for a bus's level: by the bus's name. */
export function busKey(bus: string): string {
  return controlKey(`bus ${bus}`, 'gain');
}

/** The key of a step grid: the grid of a named sequence. */
export function stepGridKey(sequence: string): string {
  return `stepGrid › ${sequence}`;
}

export interface TrackDocument {
  /** Made by the client when the track is added. Never reused, never shown; it names the track's scope. */
  id: string;
  name: string;
  /** The track's script: its chain, its sequences, the controls it declares. Runs in a scope of its own. */
  script: string;
  /** Channel strip: the level of the track's `channel` bus, as a gain (1 is unity). */
  level: number;
  /** Channel strip: -1 (left) to 1 (right). */
  pan: number;
  values: ScopeValues;
}

/**
 * A sound in the pool: where its audio comes from, and what belongs to the sound itself whichever
 * tracks play it (its slices).
 */
export interface SampleSource {
  /** A URL the app can fetch: one of the built-in sounds. */
  url?: string;
  /**
   * A file the person added from their device: the key of its bytes in the file store kept next to
   * the project (project/storage.ts). The bytes are never in the document.
   */
  file?: string;
  /** For an added file: the name it had on the device. */
  label?: string;
  /**
   * Slice boundaries in seconds, ascending, from 0 to the length of the sound. Absent: the sound is
   * one slice. They are the sound's, so two tracks playing it share them.
   */
  slices?: number[];
}

/** The built-in two-bar loop: its name in the pool, its length and the slices it starts with (eighths). */
export const LOOP_SAMPLE = 'loop';
export const LOOP_SECONDS = 4;
export const LOOP_SLICES: readonly number[] = Array.from(
  { length: 17 },
  (_, index) => (LOOP_SECONDS * index) / 16,
);

export interface ProjectDocument {
  schemaVersion: typeof SCHEMA_VERSION;
  name: string;
  bpm: number;
  /** The version of cracked-up the scripts were last written against. */
  crackedUpVersion: string;
  /** The project script: buses, the master chain. Runs on the root scope, before the tracks. */
  script: string;
  /** The values set for what the project script declares. */
  values: ScopeValues;
  /** In the order they are listed. */
  tracks: TrackDocument[];
  /** The sample pool: the name scripts use (`buffer: 'kick'`) to its source. */
  samples: Record<string, SampleSource>;
}

/** The scope id of the project script (the engine's root scope). Track scopes use the track's id. */
export const PROJECT_SCOPE = 'project';

export function emptyValues(): ScopeValues {
  return { controls: {} };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValues(value: unknown): value is ScopeValues {
  return isRecord(value) && isRecord(value['controls']);
}

/** Whether a value is a document of the current schema version. */
export function isProjectDocument(value: unknown): value is ProjectDocument {
  if (!isRecord(value)) return false;
  if (value['schemaVersion'] !== SCHEMA_VERSION) return false;
  if (
    typeof value['name'] !== 'string' ||
    typeof value['script'] !== 'string'
  ) {
    return false;
  }
  if (typeof value['bpm'] !== 'number' || !Number.isFinite(value['bpm'])) {
    return false;
  }
  if (!isValues(value['values']) || !isRecord(value['samples'])) return false;
  if (!Array.isArray(value['tracks'])) return false;
  return value['tracks'].every(
    (track: unknown) =>
      isRecord(track) &&
      typeof track['id'] === 'string' &&
      typeof track['name'] === 'string' &&
      typeof track['script'] === 'string' &&
      typeof track['level'] === 'number' &&
      typeof track['pan'] === 'number' &&
      isValues(track['values']),
  );
}

/**
 * Version 1's values: step patterns by sequence name, each with the pattern the script had given
 * (`code`), which decided whether the stored one still applied.
 */
function valuesFromV1(values: unknown): unknown {
  if (!isRecord(values) || !isRecord(values['sequences'])) return values;
  const controls: Record<string, ControlState> = {};
  for (const [name, stored] of Object.entries(values['sequences'])) {
    if (isRecord(stored) && Array.isArray(stored['value'])) {
      controls[stepGridKey(name)] = { value: stored['value'] as number[] };
    }
  }
  return { controls };
}

/** Version 4's name for `stepGrid`, called as a function: the whole word, not a member or part of a longer name. */
const V4_SEQUENCER_CALL = /(?<![\w$.])sequencer(?=\s*\()/g;
const V4_SEQUENCER_KEY = 'sequencer › ';

function stepGridScript(script: unknown): unknown {
  return typeof script === 'string'
    ? script.replace(V4_SEQUENCER_CALL, 'stepGrid')
    : script;
}

function stepGridValues(values: unknown): unknown {
  if (!isRecord(values) || !isRecord(values['controls'])) return values;
  return {
    ...values,
    controls: Object.fromEntries(
      Object.entries(values['controls']).map(([key, state]) => [
        key.startsWith(V4_SEQUENCER_KEY)
          ? stepGridKey(key.slice(V4_SEQUENCER_KEY.length))
          : key,
        state,
      ]),
    ),
  };
}

/** What version 2's templates ended a track's chain with. */
const V2_TO_OUT = ".to('out')";

/**
 * Brings a stored document up to the current schema version, one version at a time. Returns null for
 * anything that is not a document this app wrote (or is from a newer version than this one knows):
 * that is ignored in favour of the default project rather than trusted.
 *
 *   1 -> 2   Controls are declared in scripts. A scope's `sequences` (step patterns, each with a copy of
 *            the script's pattern) become entries of its new `controls` record, keyed as step grids,
 *            without the copy. The scripts themselves are not edited: a version 1 script has no
 *            `stepGrid('…')` line, so its stored pattern is kept but dormant until one is added.
 *   2 -> 3   The bus Euclip makes for every track is called `channel`, not `out`. In track scripts the
 *            exact text `.to('out')` (what the app's own templates wrote) becomes `.to('channel')`.
 *            Nothing else in a script is touched: a script that spelled it another way sends to a bus
 *            that no longer exists, and its channel strip says so.
 *   3 -> 4   A sound in the pool can have slices and can be a file the person added. Nothing stored
 *            changes shape; the built-in two-bar loop joins the pool (unless something has its name).
 *   4 -> 5   The script function that declares a step grid is `stepGrid('name')`; it was called
 *            `sequencer`, which read too much like `__.transport.sequence`. In every script, calls of
 *            `sequencer(` as a whole word (not `my.sequencer(`, not `resequencer(`) become `stepGrid(`,
 *            and the stored patterns move from their `sequencer › name` keys to `stepGrid › name`.
 *            The old name is not kept as an alias.
 */
export function migrateProject(value: unknown): ProjectDocument | null {
  if (!isRecord(value)) return null;
  let doc: Record<string, unknown> = value;
  if (doc['schemaVersion'] === 1) {
    doc = {
      ...doc,
      schemaVersion: 2,
      values: valuesFromV1(doc['values']),
      tracks: Array.isArray(doc['tracks'])
        ? doc['tracks'].map((track: unknown) =>
            isRecord(track)
              ? { ...track, values: valuesFromV1(track['values']) }
              : track,
          )
        : doc['tracks'],
    };
  }
  if (doc['schemaVersion'] === 2) {
    doc = {
      ...doc,
      schemaVersion: 3,
      tracks: Array.isArray(doc['tracks'])
        ? doc['tracks'].map((track: unknown) =>
            isRecord(track) && typeof track['script'] === 'string'
              ? {
                  ...track,
                  script: track['script'].replaceAll(
                    V2_TO_OUT,
                    ".to('channel')",
                  ),
                }
              : track,
          )
        : doc['tracks'],
    };
  }
  if (doc['schemaVersion'] === 3) {
    const samples = isRecord(doc['samples']) ? doc['samples'] : {};
    doc = {
      ...doc,
      schemaVersion: 4,
      samples:
        LOOP_SAMPLE in samples
          ? samples
          : {
              ...samples,
              [LOOP_SAMPLE]: {
                url: `/samples/${LOOP_SAMPLE}.wav`,
                slices: [...LOOP_SLICES],
              },
            },
    };
  }
  if (doc['schemaVersion'] === 4) {
    doc = {
      ...doc,
      schemaVersion: 5,
      script: stepGridScript(doc['script']),
      values: stepGridValues(doc['values']),
      tracks: Array.isArray(doc['tracks'])
        ? doc['tracks'].map((track: unknown) =>
            isRecord(track)
              ? {
                  ...track,
                  script: stepGridScript(track['script']),
                  values: stepGridValues(track['values']),
                }
              : track,
          )
        : doc['tracks'],
    };
  }
  return isProjectDocument(doc) ? doc : null;
}
