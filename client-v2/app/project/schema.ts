/**
 * The project document: everything a project is, as one plain JSON value.
 *
 * Structure lives in code and values live here. A script creates nodes, chains and sequences; what the
 * user then changes in the UI (a step pattern, the channel strip) is stored next to the script,
 * and never rewrites it. How the project is being looked at (which pane, script or UI) is not here: that
 * belongs to the person and the device (see services/view.ts).
 */

/** Bumped whenever the shape below changes in a way old documents need migrating for. */
export const SCHEMA_VERSION = 1;

/**
 * A value the user set in the UI, with what the script gave the same thing at that time.
 *
 * "Last touched wins": after each run of the script, the value the script produces now is compared with
 * `code`. If they are the same the script has not touched it since, and `value` is applied again. If they
 * differ the script was edited after the user's change, and the override is dropped.
 */
export interface ValueOverride<T> {
  /** what the user set */
  value: T;
  /** what the script produced when it last ran: the baseline the next run is compared with */
  code: T;
}

/**
 * The values the user has set for what one script makes (a track's, or the project script's).
 *
 * Only step patterns for now. Parameter values are deliberately not here: a control will exist only
 * where a script declares one, and how that is declared (and so how its value is keyed) is not settled.
 */
export interface ScopeValues {
  /**
   * Step patterns the user has edited, by sequence name. An entry whose sequence is not in the script
   * at the moment is kept, and applies again if the sequence comes back.
   */
  sequences: Record<string, ValueOverride<number[]>>;
}

export interface TrackDocument {
  /** Made by the client when the track is added. Never reused, never shown; it names the track's scope. */
  id: string;
  name: string;
  /** The track's script: its chain, then its sequences. Runs in a scope of its own. */
  script: string;
  /** Channel strip: the level of the track's `out` bus, as a gain (1 is unity). */
  level: number;
  /** Channel strip: -1 (left) to 1 (right). */
  pan: number;
  values: ScopeValues;
}

/** Where a sound in the pool comes from. */
export interface SampleSource {
  /** A URL the app can fetch: one of the built-in sounds for now. */
  url: string;
}

export interface ProjectDocument {
  schemaVersion: typeof SCHEMA_VERSION;
  name: string;
  bpm: number;
  /** The version of cracked-up the scripts were last written against. */
  crackedUpVersion: string;
  /** The project script: buses, the master chain. Runs on the root scope, before the tracks. */
  script: string;
  /** The values set for what the project script makes. */
  values: ScopeValues;
  /** In the order they are listed. */
  tracks: TrackDocument[];
  /** The sample pool: the name scripts use (`buffer: 'kick'`) to its source. */
  samples: Record<string, SampleSource>;
}

/** The scope id of the project script (the engine's root scope). Track scopes use the track's id. */
export const PROJECT_SCOPE = 'project';

export function emptyValues(): ScopeValues {
  return { sequences: {} };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValues(value: unknown): value is ScopeValues {
  return isRecord(value) && isRecord(value['sequences']);
}

/**
 * Whether a value read from storage is a document this version can open. Anything else (another schema
 * version, a half-written record) is ignored in favour of the default project rather than trusted.
 */
export function isProjectDocument(value: unknown): value is ProjectDocument {
  if (!isRecord(value)) return false;
  if (value['schemaVersion'] !== SCHEMA_VERSION) return false;
  if (typeof value['name'] !== 'string' || typeof value['script'] !== 'string')
    return false;
  if (typeof value['bpm'] !== 'number' || !Number.isFinite(value['bpm']))
    return false;
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
