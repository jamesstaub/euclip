import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { isDestroying } from '@ember/destroyable';
import { isTesting, macroCondition } from '@embroider/macros';
import { waitForPromise } from '@ember/test-waiters';
import { defaultProject } from 'client-v2/project/default-project';
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
  type FileStorage,
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
  | { kind: 'replace'; reason: 'load' | 'undo' | 'redo' };

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
  @tracked private past: HistoryEntry[] = [];
  @tracked private future: ProjectDocument[] = [];

  #listeners = new Set<(change: ProjectChange) => void>();
  #loading: Promise<void> | undefined;
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
   * Loads the saved project, once. Until it resolves (and if nothing is saved) the document is the
   * default project.
   */
  load(): Promise<void> {
    this.#loading ??= waitForPromise(
      this.storage.load().then((saved) => {
        if (!saved || isDestroying(this)) return;
        this.doc = saved;
        this.past = [];
        this.future = [];
        this.#tell({ kind: 'replace', reason: 'load' });
      }),
    );
    return this.#loading;
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
    return this.storage.save(this.doc);
  }

  #saveSoon(): void {
    clearTimeout(this.#saveTimer);
    this.#saveTimer = setTimeout(() => {
      if (!isDestroying(this)) void this.flush();
    }, AUTOSAVE_DELAY_MS);
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
