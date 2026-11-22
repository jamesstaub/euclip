import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { isDestroying } from '@ember/destroyable';
import { isTesting, macroCondition } from '@embroider/macros';
import { waitForPromise } from '@ember/test-waiters';
import { defaultProject } from 'client-v2/project/default-project';
import {
  buildExport,
  parseEuclipFile,
  shelveEmbedded,
  withShelfKeys,
  type EuclipFile,
} from 'client-v2/project/file';
import {
  applyOperation,
  sameTarget,
  type Operation,
} from 'client-v2/project/operations';
import type { ProjectDocument, TrackDocument } from 'client-v2/project/schema';
import {
  IndexedDbStorage,
  MemoryFiles,
  MemoryStorage,
  newProjectId,
  type FileStorage,
  type ProjectInfo,
  type ProjectRecord,
  type ProjectStorage,
} from 'client-v2/project/storage';

/** How long after the last change the project is written to storage. */
export const AUTOSAVE_DELAY_MS = 800;
/** Operations on the same thing (typing in one script, dragging one slider) this close together undo as one. */
const UNDO_GROUP_MS = 1000;
const UNDO_LIMIT = 200;

/** What a listener is told: one operation was applied, or the whole document was replaced. */
export type ProjectChange =
  | { kind: 'operation'; op: Operation; derived: boolean }
  | { kind: 'replace'; reason: 'load' | 'undo' | 'redo' | 'switch' };

/** What the project bar says about keeping the project: written, being written, or not writable. */
export type SaveState = 'saved' | 'saving' | 'failed';

interface HistoryEntry {
  doc: ProjectDocument;
  op: Operation;
  at: number;
  /** the gesture the operation was part of, when the caller said */
  group?: string;
}

/** Whether two documents say the same thing. (Used once per grouped gesture's operation: documents are small.) */
function sameDocument(a: ProjectDocument, b: ProjectDocument): boolean {
  return a === b || JSON.stringify(a) === JSON.stringify(b);
}

/**
 * The project store: holds the document as tracked state, and is the one path every change takes.
 *
 * `apply(operation)` is that path. Undo and redo hang off it (documents are immutable, so history is a
 * list of earlier documents), listeners hear every change (the audio engine is one), and the document
 * is saved to IndexedDB a moment after the last change. Collaboration would hang off the same path:
 * operations are plain data.
 */
export default class ProjectService extends Service {
  /** Where the project is kept between visits. Tests use memory, so they never share a project. */
  storage: ProjectStorage = macroCondition(isTesting())
    ? new MemoryStorage()
    : new IndexedDbStorage();

  /** Where the audio the person adds is kept: beside the project, not in it. */
  files: FileStorage = macroCondition(isTesting())
    ? new MemoryFiles()
    : new IndexedDbStorage();

  @tracked doc: ProjectDocument = defaultProject();
  /** The id of the open project. (A project nothing has been written for yet has one already.) */
  @tracked currentId: string = newProjectId();
  @tracked saveState: SaveState = 'saved';
  @tracked private past: HistoryEntry[] = [];
  @tracked private future: ProjectDocument[] = [];

  #listeners = new Set<(change: ProjectChange) => void>();
  #loading: Promise<void> | undefined;
  /** when the open project was first written; undefined until it has been */
  #createdAt: number | undefined;
  /** the open project has changes that are not written (or has never been) */
  #dirty = true;
  #writing: Promise<unknown> = Promise.resolve();
  #rememberedOpen = false;
  #saveTimer: ReturnType<typeof setTimeout> | undefined;
  #onHide = (): void => {
    if (document.visibilityState === 'hidden') void this.flush();
  };

  constructor(...args: ConstructorParameters<typeof Service>) {
    super(...args);
    document.addEventListener('visibilitychange', this.#onHide);
    window.addEventListener('pagehide', this.#onHide);
  }

  willDestroy(): void {
    super.willDestroy();
    clearTimeout(this.#saveTimer);
    document.removeEventListener('visibilitychange', this.#onHide);
    window.removeEventListener('pagehide', this.#onHide);
  }

  get tracks(): readonly TrackDocument[] {
    return this.doc.tracks;
  }

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }

  /**
   * Loads the saved project, once: the one that was open last, else the latest. Until it resolves (and
   * if nothing is saved) the document is the default project.
   */
  load(): Promise<void> {
    this.#loading ??= waitForPromise(
      this.#latest().then((saved) => {
        if (!saved || isDestroying(this)) return;
        this.#become(saved);
        this.#rememberedOpen = true;
        this.#tell({ kind: 'replace', reason: 'load' });
      }),
    );
    return this.#loading;
  }

  async #latest(): Promise<ProjectRecord | null> {
    const remembered = await this.storage.openId();
    if (remembered !== null) {
      const record = await this.storage.readProject(remembered);
      if (record) return record;
    }
    for (const info of await this.storage.listProjects()) {
      const record = await this.storage.readProject(info.id);
      if (record) return record;
    }
    return null;
  }

  /** Makes a stored project the open one: its history, and what was waiting to be written, are left behind. */
  #become(record: {
    id: string;
    createdAt: number;
    doc: ProjectDocument;
  }): void {
    clearTimeout(this.#saveTimer);
    this.#saveTimer = undefined;
    this.currentId = record.id;
    this.#createdAt = record.createdAt;
    this.#dirty = false;
    this.doc = record.doc;
    this.past = [];
    this.future = [];
    this.saveState = 'saved';
  }

  /**
   * Applies one operation: the only way the document changes.
   * @param derived the operation follows from another change (the runner dropping an override the
   *   script has overtaken) and is not a step of its own to undo.
   * @param group a name for the gesture this is part of (one drag of a handle): every operation of the
   *   same target given the same name is one step to undo, however long the gesture takes.
   */
  apply(
    op: Operation,
    { derived = false, group }: { derived?: boolean; group?: string } = {},
  ): void {
    const before = this.doc;
    const after = applyOperation(before, op);
    if (after === before) return;
    if (!derived) {
      const last = this.past.at(-1);
      const now = Date.now();
      if (
        last &&
        (group !== undefined
          ? // one named gesture, whatever it touches (a loop start and the loop end that goes with it)
            last.group === group
          : last.group === undefined &&
            sameTarget(last.op, op) &&
            now - last.at < UNDO_GROUP_MS)
      ) {
        // part of the same gesture: keep the document from before the gesture began; and if the
        // gesture has come back to where it began (a double click's two toggles), it is no step at all
        this.past =
          group !== undefined &&
          // (a grid's steps, or forgetting them: not asked of every move of a dragged handle)
          ((op.type === 'setControlValue' && Array.isArray(op.value)) ||
            op.type === 'resetControl') &&
          sameDocument(last.doc, after)
            ? this.past.slice(0, -1)
            : [...this.past.slice(0, -1), { ...last, at: now }];
      } else {
        this.past = [
          ...this.past.slice(-UNDO_LIMIT + 1),
          { doc: before, op, at: now, ...(group ? { group } : {}) },
        ];
      }
      this.future = [];
    }
    this.doc = after;
    this.#dirty = true;
    this.#tell({ kind: 'operation', op, derived });
    this.#saveSoon();
  }

  undo(): void {
    const entry = this.past.at(-1);
    if (!entry) return;
    this.past = this.past.slice(0, -1);
    this.future = [...this.future, this.doc];
    this.doc = entry.doc;
    this.#tell({ kind: 'replace', reason: 'undo' });
    this.#saveSoon();
  }

  redo(): void {
    const next = this.future.at(-1);
    if (!next) return;
    this.future = this.future.slice(0, -1);
    this.past = [
      ...this.past,
      // the operation is only used to group gestures; a redo never joins one
      { doc: this.doc, op: { type: 'setProjectName', name: next.name }, at: 0 },
    ];
    this.doc = next;
    this.#tell({ kind: 'replace', reason: 'redo' });
    this.#saveSoon();
  }

  /** Hears every change after it has been made. Returns the way to stop listening. */
  subscribe(listener: (change: ProjectChange) => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  /** Writes the document to storage now. A failure is logged by the storage and otherwise ignored. */
  flush(): Promise<boolean> {
    clearTimeout(this.#saveTimer);
    this.#saveTimer = undefined;
    const doc = this.doc;
    const id = this.currentId;
    this.saveState = 'saving';
    // one write after another: a slow earlier write never lands over a later one
    const writing = this.#writing.then(async () => {
      const info = await this.storage.writeProject(id, doc, this.#createdAt);
      if (info && id === this.currentId) {
        this.#createdAt = info.createdAt;
        if (!this.#rememberedOpen) {
          this.#rememberedOpen = true;
          await this.storage.setOpenId(id);
        }
        if (doc === this.doc) this.#dirty = false;
      }
      if (!isDestroying(this) && id === this.currentId && doc === this.doc) {
        this.saveState = info ? 'saved' : 'failed';
      }
      return info !== null;
    });
    this.#writing = writing;
    return writing;
  }

  #saveSoon(): void {
    this.saveState = 'saving';
    clearTimeout(this.#saveTimer);
    this.#saveTimer = setTimeout(() => {
      if (!isDestroying(this)) void this.flush();
    }, AUTOSAVE_DELAY_MS);
  }

  /** Writes what is not written, until nothing is (a change can arrive while a write is under way). */
  async #settle(): Promise<void> {
    while (this.#dirty) {
      const doc = this.doc;
      if (!(await this.flush())) return;
      if (doc === this.doc) return;
    }
  }

  // --- Many projects ---------------------------------------------------------------------------------

  /** Every stored project, latest first, the open one up to date. */
  async projects(): Promise<ProjectInfo[]> {
    await this.#settle();
    return this.storage.listProjects();
  }

  /** Opens another stored project. Resolves false when it cannot be read. History does not carry over. */
  async openProject(id: string): Promise<boolean> {
    if (id === this.currentId) return true;
    await this.#settle();
    const record = await this.storage.readProject(id);
    if (!record || isDestroying(this)) return false;
    return this.#enter(record);
  }

  /** A new project, from the starter, stored and opened. Resolves its id. */
  async newProject(): Promise<string> {
    await this.#settle();
    return this.#addAndOpen(defaultProject());
  }

  /** A copy of a stored project, named "… copy". It is not opened. Resolves its id, or null if it is gone. */
  async duplicateProject(id: string): Promise<string | null> {
    await this.#settle();
    const record = await this.storage.readProject(id);
    if (!record) return null;
    const copy = newProjectId();
    const info = await this.storage.writeProject(copy, {
      ...record.doc,
      name: `${record.doc.name} copy`,
    });
    return info ? copy : null;
  }

  /**
   * Removes a project. The sounds it used stay on the shelf, which belongs to no project: another
   * project (or the shelf itself) may still use them. Deleting the open one opens the latest of the
   * others, or a new starter project when there is none.
   */
  async deleteProject(id: string): Promise<void> {
    if (id === this.currentId) {
      await this.#settle();
      await this.storage.removeProject(id);
      for (const info of await this.storage.listProjects()) {
        const record = await this.storage.readProject(info.id);
        if (record && (await this.#enter(record))) return;
      }
      await this.#addAndOpen(defaultProject());
      return;
    }
    await this.storage.removeProject(id);
  }

  /**
   * The project as a `.euclip` file's content: the document and the person's own sounds it uses.
   * (What is not yet written is in it: it is the open document.)
   */
  exportFile(): Promise<EuclipFile> {
    return buildExport(this.doc, this.files);
  }

  /**
   * Reads a `.euclip` file's text into a NEW project (never over one) and opens it; its embedded sounds
   * join the shelf unless the shelf has them. Throws an ImportError for a file that cannot be used.
   *
   * It is somebody's script, stored and opened like any project: this adds nothing that runs it any
   * differently.
   * TODO(sandbox): an imported project is "opened from someone else". When the sandbox for shared
   * projects exists (docs/plans/euclip-sandbox-only-in-collaboration), this is where its scripts would
   * be opened in the sandbox instead of directly: mark the new record as foreign here.
   */
  async importFile(text: string): Promise<string> {
    const { doc, sounds } = parseEuclipFile(text);
    const keys = await shelveEmbedded(sounds, this.files);
    await this.#settle();
    return this.#addAndOpen(withShelfKeys(doc, keys));
  }

  async #addAndOpen(doc: ProjectDocument): Promise<string> {
    const id = newProjectId();
    const info = await this.storage.writeProject(id, doc);
    // (if it could not be written it is still opened, from memory, and says so as "not saved")
    await this.#enter({ id, createdAt: info?.createdAt ?? Date.now(), doc });
    if (!info) this.saveState = 'failed';
    return id;
  }

  async #enter(record: {
    id: string;
    createdAt: number;
    doc: ProjectDocument;
  }): Promise<boolean> {
    this.#become(record);
    this.#rememberedOpen = true;
    this.#tell({ kind: 'replace', reason: 'switch' });
    await this.storage.setOpenId(record.id);
    return true;
  }

  #tell(change: ProjectChange): void {
    for (const listener of this.#listeners) listener(change);
  }
}

declare module '@ember/service' {
  interface Registry {
    project: ProjectService;
  }
}
