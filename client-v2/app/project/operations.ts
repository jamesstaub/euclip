/**
 * Every change to a project document is one of these named operations, applied by `applyOperation`.
 * Nothing else writes the document, so this is the one place undo, redo and (later) collaboration hang
 * off. Operations are plain data: they can be logged, sent and replayed.
 */
import type {
  ProjectDocument,
  ScopeValues,
  TrackDocument,
} from 'client-v2/project/schema';
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
  /** The user edited a named sequence's steps. `code` is the pattern the script gave it. */
  | {
      type: 'setSteps';
      scope: string;
      sequence: string;
      steps: number[];
      code: number[];
    }
  | { type: 'clearSteps'; scope: string; sequence: string }
  | { type: 'setSample'; name: string; url: string }
  | { type: 'removeSample'; name: string };

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

function without<T>(record: Record<string, T>, key: string): Record<string, T> {
  const rest = { ...record };
  delete rest[key];
  return rest;
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

    case 'setSteps':
      return withValues(doc, op.scope, (values) => ({
        ...values,
        sequences: {
          ...values.sequences,
          [op.sequence]: { value: [...op.steps], code: [...op.code] },
        },
      }));

    case 'clearSteps':
      return withValues(doc, op.scope, (values) =>
        op.sequence in values.sequences
          ? { ...values, sequences: without(values.sequences, op.sequence) }
          : values,
      );

    case 'setSample':
      return {
        ...doc,
        samples: { ...doc.samples, [op.name]: { url: op.url } },
      };

    case 'removeSample':
      return op.name in doc.samples
        ? { ...doc, samples: without(doc.samples, op.name) }
        : doc;
  }
}

/** Typing in a script, or dragging a fader, is many operations but one thing to undo. */
export function sameTarget(a: Operation, b: Operation): boolean {
  if (a.type !== b.type) return false;
  switch (a.type) {
    case 'setScript':
      return a.scope === (b as typeof a).scope;
    case 'setTrackLevel':
    case 'setTrackPan':
      return a.id === (b as typeof a).id;
    case 'setBpm':
    case 'setProjectName':
      return true;
    default:
      return false;
  }
}
