import { waitForPromise } from '@ember/test-waiters';
import type { CatalogStore, createEditor } from 'cracked-up/editor';

export interface EditorKit {
  createEditor: typeof createEditor;
  /** shared by every editor */
  catalog: CatalogStore;
}

let kit: Promise<EditorKit> | undefined;

/**
 * Loads the editor (cracked-up/editor and CodeMirror) the first time an editor is shown, so the UI view
 * does not pay for it. Everything that imports CodeMirror must be reached through here.
 */
export function loadEditor(): Promise<EditorKit> {
  kit ??= waitForPromise(
    Promise.all([import('cracked-up/editor'), import('./catalog')]).then(
      ([editor, catalog]) => ({
        createEditor: editor.createEditor,
        catalog: catalog.sharedCatalog(),
      }),
    ),
  );
  return kit;
}
