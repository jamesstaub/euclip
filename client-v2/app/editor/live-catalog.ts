/**
 * The names the editors' completion offers from the live project (its sounds, node ids, buses and
 * sequences). The audio service writes them here after each run; the editors' catalog, which only
 * loads with the editor, reads and follows them. This module must not import the editor or CodeMirror.
 */
import type { LiveCatalog } from 'client-v2/audio/runner';

let current: LiveCatalog = { buffers: [], ids: [], buses: [], sequences: [] };
const listeners = new Set<(catalog: LiveCatalog) => void>();

export function getLiveCatalog(): LiveCatalog {
  return current;
}

export function setLiveCatalog(catalog: LiveCatalog): void {
  current = catalog;
  for (const listener of listeners) listener(catalog);
}

export function onLiveCatalog(
  listener: (catalog: LiveCatalog) => void,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
