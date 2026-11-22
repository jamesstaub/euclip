/**
 * Every change to a project document is one of these named operations, applied by `applyOperation`.
 * Nothing else writes the document, so this is the one place undo, redo and (later) collaboration hang
 * off. Operations are plain data: they can be logged, sent and replayed.
 */
import type {
  ControlState,
  ControlUserOptions,
  ProjectDocument,
  SampleSource,
  ScopeValues,
  StoredValue,
  TrackDocument,
} from 'client-v2/project/schema';
import { BUFFER_OPTION } from 'client-v2/controls/declarations';
import { renameInScript } from 'client-v2/project/pool';
import { PROJECT_SCOPE } from 'client-v2/project/schema';

export type Operation =
  | { type: 'setProjectName'; name: string }
  | { type: 'setBpm'; bpm: number }
  /** `scope` is a track id, or PROJECT_SCOPE for the project script. */
  | { type: 'setScript'; scope: string; script: string }
  | { type: 'addTrack'; track: TrackDocument; index?: number }
  | { type: 'removeTrack'; id: string }
  | { type: 'renameTrack'; id: string; name: string }
  | { type: 'setTrackLevel'; id: string; level: number }
  | { type: 'setTrackPan'; id: string; pan: number }
  | { type: 'setTrackMute'; id: string; mute: boolean }
  | { type: 'setTrackSolo'; id: string; solo: boolean }
  /**
   * A declared control was moved: a slider's value, a step grid's steps. `key` is its key in the
   * scope's `controls`.
   */
  | { type: 'setControlValue'; scope: string; key: string; value: StoredValue }
  /** Forgets a control's value: what the script itself says applies again. */
  | { type: 'resetControl'; scope: string; key: string }
  /** A setting of the control itself (its slider mode). A setting given as undefined is removed. */
  | {
      type: 'setControlOptions';
      scope: string;
      key: string;
      options: ControlUserOptions;
    }
  | { type: 'setSample'; name: string; url: string }
  /** Adds a sound to the pool (a file the person added), or replaces the one of that name. */
  | { type: 'addSample'; name: string; source: SampleSource }
  /** Sets a sound's slice boundaries. Fewer than three boundaries is one slice: nothing is stored. */
  | { type: 'setSampleSlices'; name: string; slices: readonly number[] }
  | { type: 'removeSample'; name: string }
  /**
   * Gives a project sound another name. The samplers that have it by the person's choice follow (that
   * is the project's own data). Scripts that name it are text the person wrote: they are rewritten
   * only when `scripts` says so.
   */
  | { type: 'renameSample'; from: string; to: string; scripts: boolean }
  /** A second project sound on the same source, with slices of its own: the same file cut another way. */
  | { type: 'duplicateSample'; name: string; as: string };

export type OperationType = Operation['type'];

export const BPM_MIN = 1;
export const BPM_MAX = 500;

function withValues(
  doc: ProjectDocument,
  scope: string,
  change: (values: ScopeValues) => ScopeValues,
): ProjectDocument {
  if (scope === PROJECT_SCOPE) {
    const values = change(doc.values);
    return values === doc.values ? doc : { ...doc, values };
  }
  return withTrack(doc, scope, (track) => {
    const values = change(track.values);
    return values === track.values ? track : { ...track, values };
  });
}

/** Changes one track. A change that returns the track it was given changes nothing. */
function withTrack(
  doc: ProjectDocument,
  id: string,
  change: (track: TrackDocument) => TrackDocument,
): ProjectDocument {
  const index = doc.tracks.findIndex((track) => track.id === id);
  const before = doc.tracks[index];
  if (!before) return doc;
  const after = change(before);
  if (after === before) return doc;
  const tracks = [...doc.tracks];
  tracks[index] = after;
  return { ...doc, tracks };
}

/** Changes what is stored for one control. A control left with nothing stored has no entry. */
function withControl(
  doc: ProjectDocument,
  scope: string,
  key: string,
  change: (state: ControlState) => ControlState,
): ProjectDocument {
  return withValues(doc, scope, (values) => {
    const before = values.controls[key];
    const after = change(before ?? {});
    if (after === before) return values;
    if (!before && Object.keys(after).length === 0) return values;
    return {
      ...values,
      controls:
        Object.keys(after).length > 0
          ? { ...values.controls, [key]: after }
          : without(values.controls, key),
    };
  });
}

function without<T>(record: Record<string, T>, key: string): Record<string, T> {
  const rest = { ...record };
  delete rest[key];
  return rest;
}

export function sameValue(
  a: StoredValue | undefined,
  b: StoredValue | undefined,
): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return (
      a.length === b.length && a.every((value, index) => value === b[index])
    );
  }
  return a === b;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * Returns the document after the operation. The document given is never changed (parts that did not
 * change are shared), and an operation that changes nothing returns the same object.
 */
export function applyOperation(
  doc: ProjectDocument,
  op: Operation,
): ProjectDocument {
  switch (op.type) {
    case 'setProjectName':
      return op.name === doc.name ? doc : { ...doc, name: op.name };

    case 'setBpm': {
      if (!Number.isFinite(op.bpm)) return doc;
      const bpm = clamp(Math.round(op.bpm), BPM_MIN, BPM_MAX);
      return bpm === doc.bpm ? doc : { ...doc, bpm };
    }

    case 'setScript':
      if (op.scope === PROJECT_SCOPE) {
        return op.script === doc.script ? doc : { ...doc, script: op.script };
      }
      return withTrack(doc, op.scope, (track) =>
        track.script === op.script ? track : { ...track, script: op.script },
      );

    case 'addTrack': {
      if (doc.tracks.some((track) => track.id === op.track.id)) return doc;
      const tracks = [...doc.tracks];
      tracks.splice(op.index ?? tracks.length, 0, op.track);
      return { ...doc, tracks };
    }

    case 'removeTrack':
      if (!doc.tracks.some((track) => track.id === op.id)) return doc;
      return {
        ...doc,
        tracks: doc.tracks.filter((track) => track.id !== op.id),
      };

    case 'renameTrack':
      return withTrack(doc, op.id, (track) => ({ ...track, name: op.name }));

    case 'setTrackLevel':
      if (!Number.isFinite(op.level)) return doc;
      return withTrack(doc, op.id, (track) => ({
        ...track,
        level: Math.max(0, op.level),
      }));

    case 'setTrackPan':
      if (!Number.isFinite(op.pan)) return doc;
      return withTrack(doc, op.id, (track) => ({
        ...track,
        pan: clamp(op.pan, -1, 1),
      }));

    case 'setTrackMute':
      return withTrack(doc, op.id, (track) =>
        Boolean(track.mute) === op.mute ? track : { ...track, mute: op.mute },
      );

    case 'setTrackSolo':
      return withTrack(doc, op.id, (track) =>
        Boolean(track.solo) === op.solo ? track : { ...track, solo: op.solo },
      );

    case 'setControlValue':
      return withControl(doc, op.scope, op.key, (state) =>
        sameValue(state.value, op.value)
          ? state
          : {
              ...state,
              value: Array.isArray(op.value) ? [...op.value] : op.value,
            },
      );

    case 'resetControl':
      return withControl(doc, op.scope, op.key, (state) => {
        if (state.value === undefined) return state;
        const rest = { ...state };
        delete rest.value;
        return rest;
      });

    case 'setControlOptions':
      return withControl(doc, op.scope, op.key, (state) => {
        const options: Record<string, unknown> = { ...state.options };
        for (const [name, value] of Object.entries(op.options)) {
          if (value === undefined) delete options[name];
          else options[name] = value;
        }
        if (JSON.stringify(options) === JSON.stringify(state.options ?? {})) {
          return state;
        }
        const rest: ControlState = { ...state };
        if (Object.keys(options).length > 0) rest.options = options;
        else delete rest.options;
        return rest;
      });

    case 'setSample':
      return {
        ...doc,
        samples: { ...doc.samples, [op.name]: { url: op.url } },
      };

    case 'addSample':
      return {
        ...doc,
        samples: { ...doc.samples, [op.name]: { ...op.source } },
      };

    case 'setSampleSlices': {
      const before = doc.samples[op.name];
      if (!before) return doc;
      const slices = [...op.slices]
        .filter((time) => Number.isFinite(time) && time >= 0)
        .sort((a, b) => a - b)
        .filter((time, index, all) => index === 0 || time !== all[index - 1]);
      if (sameValue(before.slices ?? [], slices.length > 2 ? slices : [])) {
        return doc;
      }
      const after: SampleSource = { ...before };
      if (slices.length > 2) after.slices = slices;
      else delete after.slices;
      return { ...doc, samples: { ...doc.samples, [op.name]: after } };
    }

    case 'removeSample':
      return op.name in doc.samples
        ? { ...doc, samples: without(doc.samples, op.name) }
        : doc;

    case 'renameSample': {
      const source = doc.samples[op.from];
      if (!source || op.to === op.from || op.to in doc.samples) return doc;
      // (in place: the pool keeps its order)
      const samples = Object.fromEntries(
        Object.entries(doc.samples).map(([name, value]) => [
          name === op.from ? op.to : name,
          value,
        ]),
      );
      const renamed = (values: ScopeValues): ScopeValues => ({
        ...values,
        controls: Object.fromEntries(
          Object.entries(values.controls).map(([key, state]) => [
            key,
            key.endsWith(` › ${BUFFER_OPTION}`) && state.value === op.from
              ? { ...state, value: op.to }
              : state,
          ]),
        ),
      });
      const text = (script: string): string =>
        op.scripts ? renameInScript(script, op.from, op.to) : script;
      return {
        ...doc,
        samples,
        script: text(doc.script),
        values: renamed(doc.values),
        tracks: doc.tracks.map((track) => ({
          ...track,
          script: text(track.script),
          values: renamed(track.values),
        })),
      };
    }

    case 'duplicateSample': {
      const source = doc.samples[op.name];
      if (!source || op.as in doc.samples) return doc;
      return {
        ...doc,
        samples: {
          ...doc.samples,
          [op.as]: {
            ...source,
            ...(source.slices ? { slices: [...source.slices] } : {}),
          },
        },
      };
    }
  }
}

/** Typing in a script, or dragging a control, is many operations but one thing to undo. */
export function sameTarget(a: Operation, b: Operation): boolean {
  if (a.type !== b.type) return false;
  switch (a.type) {
    case 'setScript':
      return a.scope === (b as typeof a).scope;
    case 'setTrackLevel':
    case 'setTrackPan':
      return a.id === (b as typeof a).id;
    case 'setSampleSlices':
      // dragging a marker is one gesture (adding and removing change the count: steps of their own)
      return (
        a.name === (b as typeof a).name &&
        a.slices.length === (b as typeof a).slices.length
      );
    case 'setControlValue': {
      // dragging a slider is one gesture; each step pressed in a grid is its own
      const other = b as typeof a;
      return (
        a.scope === other.scope &&
        a.key === other.key &&
        !Array.isArray(a.value)
      );
    }
    case 'setBpm':
    case 'setProjectName':
      return true;
    default:
      return false;
  }
}
