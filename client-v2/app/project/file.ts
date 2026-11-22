/**
 * The `.euclip` file: one project to take to another machine, and the way back in. Pure apart from the
 * file storage it is given.
 *
 * ```json
 * { "format": "euclip-project", "version": 1, "project": { …the document… },
 *   "sounds": [{ "id": "f-…", "name": "kick.wav", "type": "audio/wav", "size": 123, "added": 0, "data": "<base64>" }] }
 * ```
 *
 * `sounds` are the person's own files the project uses (a pool entry with `file`), embedded so the file
 * is whole. Library sounds and built-ins stay references in the document. An imported file is somebody
 * else's script: it is stored, and opened, like any project. Nothing here runs it.
 */
import { MAX_FILE_BYTES, newFileId } from 'client-v2/project/pool';
import { migrateProject, type ProjectDocument } from 'client-v2/project/schema';
import type { FileStorage } from 'client-v2/project/storage';

export const EUCLIP_FORMAT = 'euclip-project';
/** The newest file version this build writes and reads. */
export const EUCLIP_FILE_VERSION = 1;
export const EUCLIP_EXTENSION = '.euclip';

export interface EmbeddedSound {
  /** the key the document's pool entry names it by, in this file */
  id: string;
  name: string;
  type: string;
  size: number;
  added: number;
  /** base64 */
  data: string;
}

export interface EuclipFile {
  format: typeof EUCLIP_FORMAT;
  version: number;
  project: ProjectDocument;
  sounds: EmbeddedSound[];
}

/** A file that cannot be imported, with the reason in words for the person. */
export class ImportError extends Error {}

export function toBase64(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes);
  let binary = '';
  for (let at = 0; at < view.length; at += 0x8000) {
    binary += String.fromCharCode(...view.subarray(at, at + 0x8000));
  }
  return btoa(binary);
}

export function fromBase64(text: string): ArrayBuffer {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let at = 0; at < binary.length; at++) bytes[at] = binary.charCodeAt(at);
  return bytes.buffer;
}

/** The file for a project: the document, and the bytes of the person's own sounds it uses. */
export async function buildExport(
  doc: ProjectDocument,
  files: FileStorage,
): Promise<EuclipFile> {
  const sounds: EmbeddedSound[] = [];
  const seen = new Set<string>();
  for (const source of Object.values(doc.samples)) {
    const id = source.file;
    if (id === undefined || seen.has(id)) continue;
    seen.add(id);
    const stored = await files.get(id);
    // (bytes that are gone from this browser are not in the file either: the sound shows as missing there)
    if (!stored) continue;
    sounds.push({
      id,
      name: stored.name,
      type: stored.type,
      size: stored.bytes.byteLength,
      added: stored.added ?? 0,
      data: toBase64(stored.bytes),
    });
  }
  return {
    format: EUCLIP_FORMAT,
    version: EUCLIP_FILE_VERSION,
    project: JSON.parse(JSON.stringify(doc)) as ProjectDocument,
    sounds,
  };
}

/** What a download of the project is called. */
export function exportFileName(name: string): string {
  const stem = name
    .normalize('NFKD')
    .replace(/[^\x20-\x7e]/g, '')
    .replace(/[^A-Za-z0-9._ -]+/g, '')
    .trim()
    .slice(0, 60);
  return `${stem === '' ? 'project' : stem}${EUCLIP_EXTENSION}`;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Reads and checks a file's text. Throws an ImportError saying what is wrong. */
export function parseEuclipFile(text: string): {
  doc: ProjectDocument;
  sounds: EmbeddedSound[];
} {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new ImportError('This is not a Euclip project file.');
  }
  if (!isRecord(value) || value['format'] !== EUCLIP_FORMAT) {
    throw new ImportError('This is not a Euclip project file.');
  }
  const version = value['version'];
  if (
    typeof version !== 'number' ||
    !Number.isInteger(version) ||
    version < 1
  ) {
    throw new ImportError('This Euclip file has no version this app knows.');
  }
  if (version > EUCLIP_FILE_VERSION) {
    throw new ImportError(
      `This file is version ${version}, made by a newer Euclip. This one reads up to version ${EUCLIP_FILE_VERSION}: update the app to open it.`,
    );
  }
  const doc = migrateProject(value['project']);
  if (!doc) {
    throw new ImportError(
      'The project in this file is not one this version of Euclip can open.',
    );
  }
  const listed = value['sounds'];
  if (listed !== undefined && !Array.isArray(listed)) {
    throw new ImportError('The sounds in this file are damaged.');
  }
  const sounds: EmbeddedSound[] = [];
  for (const entry of (listed ?? []) as unknown[]) {
    if (
      !isRecord(entry) ||
      typeof entry['id'] !== 'string' ||
      typeof entry['name'] !== 'string' ||
      typeof entry['data'] !== 'string'
    ) {
      throw new ImportError('The sounds in this file are damaged.');
    }
    sounds.push({
      id: entry['id'],
      name: entry['name'],
      type: typeof entry['type'] === 'string' ? entry['type'] : '',
      size: typeof entry['size'] === 'number' ? entry['size'] : 0,
      added: typeof entry['added'] === 'number' ? entry['added'] : 0,
      data: entry['data'],
    });
  }
  return { doc, sounds };
}

function sameBytes(a: ArrayBuffer, b: ArrayBuffer): boolean {
  if (a.byteLength !== b.byteLength) return false;
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  for (let at = 0; at < x.length; at++) if (x[at] !== y[at]) return false;
  return true;
}

/**
 * Puts a file's embedded sounds on the shelf, and says which shelf key each is now under. A sound the
 * shelf already has is not added again: nothing in a stored sound is a content hash, so it is the same
 * name and size, confirmed by comparing the bytes. Throws an ImportError for bytes that are not valid
 * or too big.
 */
export async function shelveEmbedded(
  sounds: readonly EmbeddedSound[],
  files: FileStorage,
): Promise<Map<string, string>> {
  const keys = new Map<string, string>();
  const shelf = await files.list();
  for (const sound of sounds) {
    let bytes: ArrayBuffer;
    try {
      bytes = fromBase64(sound.data);
    } catch {
      throw new ImportError(
        `The sound "${sound.name}" in this file is damaged.`,
      );
    }
    if (bytes.byteLength > MAX_FILE_BYTES) {
      throw new ImportError(
        `The sound "${sound.name}" in this file is too big.`,
      );
    }
    let key: string | undefined;
    for (const entry of shelf) {
      if (entry.name !== sound.name || entry.size !== bytes.byteLength)
        continue;
      const stored = await files.get(entry.id);
      if (stored && sameBytes(stored.bytes, bytes)) {
        key = entry.id;
        break;
      }
    }
    if (key === undefined) {
      key = newFileId();
      await files.put(key, {
        bytes,
        name: sound.name,
        type: sound.type,
        added: Date.now(),
      });
      shelf.push({
        id: key,
        name: sound.name,
        type: sound.type,
        size: bytes.byteLength,
        added: Date.now(),
      });
    }
    keys.set(sound.id, key);
  }
  return keys;
}

/** The document with its own-file sounds pointing at the keys they now have on the shelf. */
export function withShelfKeys(
  doc: ProjectDocument,
  keys: ReadonlyMap<string, string>,
): ProjectDocument {
  return {
    ...doc,
    samples: Object.fromEntries(
      Object.entries(doc.samples).map(([name, source]) => [
        name,
        source.file !== undefined && keys.has(source.file)
          ? { ...source, file: keys.get(source.file)! }
          : source,
      ]),
    ),
  };
}
