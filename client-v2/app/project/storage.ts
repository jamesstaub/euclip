/**
 * Where a project is kept between visits: IndexedDB, one record. Every failure (no IndexedDB, private
 * mode, a full disk, a blocked upgrade) resolves quietly: the app then works from memory only.
 */
import { migrateProject, type ProjectDocument } from 'client-v2/project/schema';

export interface ProjectStorage {
  /** The saved project, or null when there is none (or it cannot be read or is not a document we know). */
  load(): Promise<ProjectDocument | null>;
  /** Resolves true when the document was written. */
  save(doc: ProjectDocument): Promise<boolean>;
}

/**
 * Where the audio a person adds is kept: the file's bytes, beside the project and never inside it (the
 * document's pool entry names the file by its key here).
 */
export interface FileStorage {
  /** Resolves true when the bytes were written. */
  put(id: string, file: StoredFile): Promise<boolean>;
  get(id: string): Promise<StoredFile | null>;
  delete(id: string): Promise<void>;
}

export interface StoredFile {
  bytes: ArrayBuffer;
  /** the name the file had on the person's device */
  name: string;
  /** its media type, as the browser reported it (may be empty) */
  type: string;
}

const STORE = 'projects';
const FILES = 'files';
const KEY = 'current';
/** 1: the project. 2: added audio files, in a store of their own. */
const DB_VERSION = 2;

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB write failed'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB write aborted'));
  });
}

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () =>
      reject(req.error ?? new Error('IndexedDB request failed'));
  });
}

export class IndexedDbStorage implements ProjectStorage, FileStorage {
  constructor(private readonly name = 'euclip-v2') {}

  #open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const opening = indexedDB.open(this.name, DB_VERSION);
      opening.onupgradeneeded = () => {
        for (const store of [STORE, FILES]) {
          if (!opening.result.objectStoreNames.contains(store)) {
            opening.result.createObjectStore(store);
          }
        }
      };
      opening.onsuccess = () => resolve(opening.result);
      opening.onerror = () =>
        reject(opening.error ?? new Error('IndexedDB would not open'));
      opening.onblocked = () =>
        reject(new Error('IndexedDB is blocked by another tab'));
    });
  }

  async load(): Promise<ProjectDocument | null> {
    try {
      const db = await this.#open();
      try {
        const value: unknown = await request(
          db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY),
        );
        // an older version's document is brought up to date; anything else is not opened
        return migrateProject(value);
      } finally {
        db.close();
      }
    } catch (error) {
      console.warn('Euclip: the saved project could not be read.', error);
      return null;
    }
  }

  async save(doc: ProjectDocument): Promise<boolean> {
    try {
      const db = await this.#open();
      try {
        const tx = db.transaction(STORE, 'readwrite');
        // a plain copy: the document's objects are shared with the app and may be frozen or proxied
        tx.objectStore(STORE).put(JSON.parse(JSON.stringify(doc)), KEY);
        await new Promise<void>((resolve, reject) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () =>
            reject(tx.error ?? new Error('IndexedDB write failed'));
          tx.onabort = () =>
            reject(tx.error ?? new Error('IndexedDB write aborted'));
        });
        return true;
      } finally {
        db.close();
      }
    } catch (error) {
      console.warn('Euclip: the project could not be saved.', error);
      return false;
    }
  }

  async put(id: string, file: StoredFile): Promise<boolean> {
    try {
      const db = await this.#open();
      try {
        const tx = db.transaction(FILES, 'readwrite');
        tx.objectStore(FILES).put(
          { bytes: file.bytes, name: file.name, type: file.type },
          id,
        );
        await done(tx);
        return true;
      } finally {
        db.close();
      }
    } catch (error) {
      console.warn('Euclip: the audio file could not be kept.', error);
      return false;
    }
  }

  async get(id: string): Promise<StoredFile | null> {
    try {
      const db = await this.#open();
      try {
        const value: unknown = await request(
          db.transaction(FILES, 'readonly').objectStore(FILES).get(id),
        );
        const file = value as Partial<StoredFile> | undefined;
        return file?.bytes instanceof ArrayBuffer
          ? {
              bytes: file.bytes,
              name: String(file.name ?? ''),
              type: String(file.type ?? ''),
            }
          : null;
      } finally {
        db.close();
      }
    } catch (error) {
      console.warn('Euclip: the audio file could not be read.', error);
      return null;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const db = await this.#open();
      try {
        const tx = db.transaction(FILES, 'readwrite');
        tx.objectStore(FILES).delete(id);
        await done(tx);
      } finally {
        db.close();
      }
    } catch {
      // (left behind: harmless)
    }
  }

  /** Removes the database. For tests. */
  clear(): Promise<void> {
    return new Promise((resolve) => {
      const deleting = indexedDB.deleteDatabase(this.name);
      deleting.onsuccess =
        deleting.onerror =
        deleting.onblocked =
          () => resolve();
    });
  }
}

/** Keeps added audio in memory only. What tests use. */
export class MemoryFiles implements FileStorage {
  files = new Map<string, StoredFile>();

  put(id: string, file: StoredFile): Promise<boolean> {
    this.files.set(id, { ...file, bytes: file.bytes.slice(0) });
    return Promise.resolve(true);
  }

  get(id: string): Promise<StoredFile | null> {
    const file = this.files.get(id);
    return Promise.resolve(
      file ? { ...file, bytes: file.bytes.slice(0) } : null,
    );
  }

  delete(id: string): Promise<void> {
    this.files.delete(id);
    return Promise.resolve();
  }
}

/** Keeps the project in memory only. What tests use, so one test's project never reaches the next. */
export class MemoryStorage implements ProjectStorage {
  saved: ProjectDocument | null = null;
  saves = 0;

  load(): Promise<ProjectDocument | null> {
    return Promise.resolve(migrateProject(this.saved));
  }

  save(doc: ProjectDocument): Promise<boolean> {
    this.saved = JSON.parse(JSON.stringify(doc)) as ProjectDocument;
    this.saves++;
    return Promise.resolve(true);
  }
}
