import type TrackModel from 'euclip/models/track';
import type TrackNodeModel from 'euclip/models/track-node';

/**
 * The sounds of a track's samplers, as the sound browser and the sampler rack see them.
 * "Index" is the sampler's place in `track.sourceNodeRecords` (what the UI's selection holds);
 * "slot" is its place among the samplers (what `track.setFile` and the filepath controls hold).
 */
export interface SamplerSlot {
  index: number;
  slot: number;
  node: TrackNodeModel;
  /** catalog path of the sound ('' when the sampler has none) */
  path: string;
  /** a name to show: the file name without folders or extension */
  name: string;
  /** 1-based, for "Sampler 1" */
  number: number;
}

/** "/Korg/Korg 01W/AGG.mp3" becomes "AGG" */
export function soundName(path: string | undefined): string {
  if (!path) return '';
  const last = path.replace(/%20/g, ' ').split('/').pop() ?? '';
  return last.replace(/\.[^.]+$/, '');
}

export function samplerSlots(track: TrackModel | undefined | null): SamplerSlot[] {
  if (!track) return [];
  const files = new Map<number, string>();
  for (const control of track.filepathControls) {
    if (!control.isDeleted && control.controlValue) files.set(control.nodeOrder, control.controlValue);
  }
  return track.sourceNodeRecords
    .map((node, index) => ({ node, index }))
    .filter(({ node }) => node.nodeType === 'sampler')
    .map(({ node, index }) => {
      const slot = node.orderOfType;
      const path = files.get(slot) ?? '';
      return { index, slot, node, path, name: soundName(path), number: slot + 1 };
    });
}

/** The sampler to fill next: the first empty one after `afterIndex`, else the first empty one; undefined if all are full. */
export function nextEmptySampler(track: TrackModel | undefined | null, afterIndex: number): SamplerSlot | undefined {
  const empty = samplerSlots(track).filter((slot) => !slot.path);
  return empty.find((slot) => slot.index > afterIndex) ?? empty[0];
}

// Picks and clears of one track run one after another: a sound's "previous" must be read after the earlier pick has
// finished downloading and saving, or an Undo would restore the wrong sound.
const queues = new WeakMap<TrackModel, Promise<unknown>>();

function inOrder<T>(track: TrackModel, job: () => Promise<T>): Promise<T> {
  const result = (queues.get(track) ?? Promise.resolve()).then(job, job);
  queues.set(track, result.catch(() => {})); // a failed pick must not block the next one
  return result;
}

/** Puts a sound in a sampler. Resolves with the sound it replaced ('' when the sampler was empty). */
export function assignSound(track: TrackModel, slot: number, path: string): Promise<string> {
  return inOrder(track, async () => {
    const previous = samplerSlots(track).find((item) => item.slot === slot)?.path ?? '';
    await track.setFile(slot, path);
    return previous;
  });
}

/**
 * Empties a sampler. The API refuses an empty path, so the slot's saved filepath control is deleted
 * (the UI then shows a client-only empty one again, as for a sampler that never had a sound).
 */
export function clearSound(track: TrackModel, slot: number): Promise<void> {
  return inOrder(track, async () => {
    const control = track.filepathControls.find((item) => item.nodeOrder === slot && !item.isDeleted);
    if (control && !control.isNew) await control.destroyRecord();
    else if (control) control.controlValue = '';
    track.setupAudioFromScripts();
  });
}
