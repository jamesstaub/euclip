/**
 * Where projects are kept between visits: IndexedDB, one record per project. Every failure (no
 * IndexedDB, private mode, a full disk, a blocked upgrade) resolves quietly: the app then works from
 * memory only.
 */
import { migrateProject, type ProjectDocument } from 'client-v2/project/schema';

/** What a list of projects shows about one. */
export interface ProjectInfo {
  id: string;
  /** the document's name, kept beside it so a list need not open every document */
  name: string;
  /** ms since 1970 */
  createdAt: number;
  /** ms since 1970: when it was last written */
  updatedAt: number;
}

/** A stored project: its list entry and the document. */
export interface ProjectRecord extends ProjectInfo {
  doc: ProjectDocument;
}

/** A key for a project. Never reused. */
export function newProjectId(): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `p-${random}`;
}

export abstract class ProjectStorage {
  /** Every project, without its document. Most recently written first. */
  abstract listProjects(): Promise<ProjectInfo[]>;
  /** One project, or null when there is none (or it cannot be read or is not a document we know). */
  abstract readProject(id: string): Promise<ProjectRecord | null>;
  /**
   * Writes a project (a new one, or over the one with this id), stamping it as written now.
   * Resolves its list entry, or null when it could not be written.
   */
  abstract writeProject(
    id: string,
    doc: ProjectDocument,
    createdAt?: number,
  ): Promise<ProjectInfo | null>;
  /** Forgets a project. (Its sounds are the shelf's, not the project's: they stay.) */
  abstract removeProject(id: string): Promise<void>;
  /** The id of the project that was open last, if one was. */
  abstract openId(): Promise<string | null>;
  abstract setOpenId(id: string): Promise<void>;

  /** The open project's document: the one remembered, else the latest written; null when there is none. */
  async load(): Promise<ProjectDocument | null> {
    const remembered = await this.openId();
    if (remembered !== null) {
      const record = await this.readProject(remembered);
      if (record) return record.doc;
    }
    for (const info of await this.listProjects()) {
      const record = await this.readProject(info.id);
      if (record) return record.doc;
    }
    return null;
  }

  /** Writes the open project's document (a first one is given an id and becomes the open one). Resolves true when written. */
  async save(doc: ProjectDocument): Promise<boolean> {
    let id = await this.openId();
    if (id === null) {
      id = newProjectId();
      await this.setOpenId(id);
    }
    const before = await this.readProject(id);
    return (await this.writeProject(id, doc, before?.createdAt)) !== null;
  }
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
  /**
   * Everything on the shelf, without the bytes: the person's own sounds, whichever projects use them.
   * Oldest first. (Kept in this browser for now. With accounts it would be a server's list: this
   * interface is what changes hands, not what the app thinks a shelf is.)
   */
  list(): Promise<ShelfEntry[]>;
}

/** One of the person's own sounds, as a list shows it. */
export interface ShelfEntry {
  id: string;
  name: string;
  type: string;
  /** bytes */
  size: number;
  /** when it was added (ms since 1970); 0 for a file added before that was kept */
  added: number;
}

export interface StoredFile {
  bytes: ArrayBuffer;
  /** the name the file had on the person's device */
  name: string;
  /** its media type, as the browser reported it (may be empty) */
  type: string;
  /** when it was added (ms since 1970) */
  added?: number;
}

const STORE = 'projects';
const FILES = 'files';
const META = 'meta';
const OPEN_KEY = 'open';
/** Version 1's one record, in a store that now holds a record per project. */
const LEGACY_KEY = 'current';
/** 1: the project. 2: added audio files, in a store of their own. 3: many projects (a record each, by id), and a store for what is open. */
const DB_VERSION = 3;

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

/** A stored project as a record, or null when it is not one we know (an older document is brought up to date). */
function recordOf(id: string, value: unknown): ProjectRecord | null {
  if (typeof value !== 'object' || value === null) return null;
  const stored = value as Partial<ProjectRecord>;
  const doc = migrateProject(stored.doc);
  if (!doc) return null;
  return {
    id,
    name: doc.name,
    createdAt: Number(stored.createdAt ?? 0),
    updatedAt: Number(stored.updatedAt ?? 0),
    doc,
  };
}

function infoOf(record: ProjectRecord): ProjectInfo {
  const { id, name, createdAt, updatedAt } = record;
  return { id, name, createdAt, updatedAt };
}

const latestFirst = (a: ProjectInfo, b: ProjectInfo): number =>
  b.updatedAt - a.updatedAt;

export class IndexedDbStorage extends ProjectStorage implements FileStorage {
  constructor(private readonly name = 'euclip-v2') {
    super();
  }

  #open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const opening = indexedDB.open(this.name, DB_VERSION);
      opening.onupgradeneeded = (event) => {
        const db = opening.result;
        for (const store of [STORE, FILES, META]) {
          if (!db.objectStoreNames.contains(store)) db.createObjectStore(store);
        }
        const tx = opening.transaction;
        if (!tx || event.oldVersion < 1 || event.oldVersion >= 3) return;
        // Before 3 there was one project, under one key. It becomes the first of the list, nothing
        // changed in it (its document is brought up to date when it is read, as any is).
        const projects = tx.objectStore(STORE);
        const reading = projects.get(LEGACY_KEY);
        reading.onsuccess = () => {
          const legacy: unknown = reading.result;
          if (typeof legacy !== 'object' || legacy === null) return;
          const raw = legacy as { name?: unknown };
          const id = newProjectId();
          const now = Date.now();
          projects.delete(LEGACY_KEY);
          projects.put(
            {
              id,
              name: typeof raw.name === 'string' ? raw.name : '',
              createdAt: now,
              updatedAt: now,
              doc: legacy,
            },
            id,
          );
          tx.objectStore(META).put(id, OPEN_KEY);
        };
      };
      opening.onsuccess = () => resolve(opening.result);
      opening.onerror = () =>
        reject(opening.error ?? new Error('IndexedDB would not open'));
      opening.onblocked = () =>
        reject(new Error('IndexedDB is blocked by another tab'));
    });
  }

  async listProjects(): Promise<ProjectInfo[]> {
    try {
      const db = await this.#open();
      try {
        const found: ProjectInfo[] = [];
        await new Promise<void>((resolve, reject) => {
          const walking = db
            .transaction(STORE, 'readonly')
            .objectStore(STORE)
            .openCursor();
          walking.onerror = () =>
            reject(walking.error ?? new Error('IndexedDB read failed'));
          walking.onsuccess = () => {
            const cursor = walking.result;
            if (!cursor) return resolve();
            const record =
              typeof cursor.key === 'string'
                ? recordOf(cursor.key, cursor.value)
                : null;
            if (record) found.push(infoOf(record));
            cursor.continue();
          };
        });
        return found.sort(latestFirst);
      } finally {
        db.close();
      }
    } catch (error) {
      console.warn('Euclip: the projects could not be listed.', error);
      return [];
    }
  }

  async readProject(id: string): Promise<ProjectRecord | null> {
    try {
      const db = await this.#open();
      try {
        const value: unknown = await request(
          db.transaction(STORE, 'readonly').objectStore(STORE).get(id),
        );
        // an older version's document is brought up to date; anything else is not opened
        return recordOf(id, value);
      } finally {
        db.close();
      }
    } catch (error) {
      console.warn('Euclip: the saved project could not be read.', error);
      return null;
    }
  }

  async writeProject(
    id: string,
    doc: ProjectDocument,
    createdAt?: number,
  ): Promise<ProjectInfo | null> {
    try {
      const db = await this.#open();
      try {
        const now = Date.now();
        const tx = db.transaction(STORE, 'readwrite');
        // a plain copy: the document's objects are shared with the app and may be frozen or proxied
        const record = {
          id,
          name: doc.name,
          createdAt: createdAt ?? now,
          updatedAt: now,
          doc: JSON.parse(JSON.stringify(doc)) as ProjectDocument,
        };
        tx.objectStore(STORE).put(record, id);
        await done(tx);
        return infoOf(record);
      } finally {
        db.close();
      }
    } catch (error) {
      console.warn('Euclip: the project could not be saved.', error);
      return null;
    }
  }

  async removeProject(id: string): Promise<void> {
    try {
      const db = await this.#open();
      try {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(id);
        await done(tx);
      } finally {
        db.close();
      }
    } catch (error) {
      console.warn('Euclip: the project could not be removed.', error);
    }
  }

  async openId(): Promise<string | null> {
    try {
      const db = await this.#open();
      try {
        const value: unknown = await request(
          db.transaction(META, 'readonly').objectStore(META).get(OPEN_KEY),
        );
        return typeof value === 'string' ? value : null;
      } finally {
        db.close();
      }
    } catch {
      return null;
    }
  }

  async setOpenId(id: string): Promise<void> {
    try {
      const db = await this.#open();
      try {
        const tx = db.transaction(META, 'readwrite');
        tx.objectStore(META).put(id, OPEN_KEY);
        await done(tx);
      } finally {
        db.close();
      }
    } catch {
      // (the next visit opens the latest project instead)
    }
  }

  async put(id: string, file: StoredFile): Promise<boolean> {
    try {
      const db = await this.#open();
      try {
        const tx = db.transaction(FILES, 'readwrite');
        tx.objectStore(FILES).put(
          {
            bytes: file.bytes,
            name: file.name,
            type: file.type,
            added: file.added ?? Date.now(),
          },
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
              added: Number(file.added ?? 0),
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

  async list(): Promise<ShelfEntry[]> {
    try {
      const db = await this.#open();
      try {
        const entries: ShelfEntry[] = [];
        await new Promise<void>((resolve, reject) => {
          const walking = db
            .transaction(FILES, 'readonly')
            .objectStore(FILES)
            .openCursor();
          walking.onerror = () =>
            reject(walking.error ?? new Error('IndexedDB read failed'));
          walking.onsuccess = () => {
            const cursor = walking.result;
            if (!cursor) return resolve();
            const file = cursor.value as Partial<StoredFile> | undefined;
            if (file?.bytes instanceof ArrayBuffer) {
              entries.push({
                id: typeof cursor.key === 'string' ? cursor.key : '',
                name: String(file.name ?? ''),
                type: String(file.type ?? ''),
                size: file.bytes.byteLength,
                added: Number(file.added ?? 0),
              });
            }
            cursor.continue();
          };
        });
        return entries.sort((a, b) => a.added - b.added);
      } finally {
        db.close();
      }
    } catch (error) {
      console.warn('Euclip: your sounds could not be listed.', error);
      return [];
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

  list(): Promise<ShelfEntry[]> {
    return Promise.resolve(
      [...this.files].map(([id, file]) => ({
        id,
        name: file.name,
        type: file.type,
        size: file.bytes.byteLength,
        added: file.added ?? 0,
      })),
    );
  }
}

/** Keeps projects in memory only. What tests use, so one test's project never reaches the next. */
export class MemoryStorage extends ProjectStorage {
  records = new Map<string, ProjectRecord>();
  open: string | null = null;
  /** how many times a project was written */
  saves = 0;

  /** The open project's document (what the one-project tests look at); setting it stores it as the open project. */
  get saved(): ProjectDocument | null {
    return (this.open !== null && this.records.get(this.open)?.doc) || null;
  }

  set saved(doc: ProjectDocument | null) {
    if (doc === null) return;
    const id = this.open ?? newProjectId();
    this.open = id;
    this.records.set(id, {
      id,
      name: doc.name,
      createdAt: 0,
      updatedAt: 0,
      doc,
    });
  }

  listProjects(): Promise<ProjectInfo[]> {
    return Promise.resolve(
      [...this.records.values()]
        .filter((record) => migrateProject(record.doc))
        .map(({ id, name, createdAt, updatedAt }) => ({
          id,
          name,
          createdAt,
          updatedAt,
        }))
        .sort(latestFirst),
    );
  }

  readProject(id: string): Promise<ProjectRecord | null> {
    const record = this.records.get(id);
    const doc = record ? migrateProject(record.doc) : null;
    return Promise.resolve(
      record && doc ? { ...record, name: doc.name, doc } : null,
    );
  }

  writeProject(
    id: string,
    doc: ProjectDocument,
    createdAt?: number,
  ): Promise<ProjectInfo | null> {
    // (strictly later than the last write, so "latest first" is an order even within a millisecond)
    const latest = Math.max(
      0,
      ...[...this.records.values()].map((r) => r.updatedAt),
    );
    const now = Math.max(Date.now(), latest + 1);
    const record: ProjectRecord = {
      id,
      name: doc.name,
      createdAt: createdAt ?? now,
      updatedAt: now,
      doc: JSON.parse(JSON.stringify(doc)) as ProjectDocument,
    };
    this.records.set(id, record);
    this.saves++;
    const { name, updatedAt } = record;
    return Promise.resolve({
      id,
      name,
      createdAt: record.createdAt,
      updatedAt,
    });
  }

  removeProject(id: string): Promise<void> {
    this.records.delete(id);
    if (this.open === id) this.open = null;
    return Promise.resolve();
  }

  openId(): Promise<string | null> {
    return Promise.resolve(this.open);
  }

  setOpenId(id: string): Promise<void> {
    this.open = id;
    return Promise.resolve();
  }
}
