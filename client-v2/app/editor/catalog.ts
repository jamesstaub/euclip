/**
 * The catalog every code editor shares: what a script can use.
 *
 * The node types come from the library's static definitions, without an engine. The sounds, ids, buses
 * and sequences come from the live project (editor/live-catalog.ts) and follow it as scripts run.
 * This module is only ever loaded with the editor (see editor/load.ts).
 */
import {
  catalogFromNodes,
  createCatalogStore,
  type CatalogStore,
  type EditorCatalog,
} from 'cracked-up/editor';
import type { LiveCatalog } from 'client-v2/audio/runner';
import { getLiveCatalog, onLiveCatalog } from 'client-v2/editor/live-catalog';

function fromLive(live: LiveCatalog): EditorCatalog {
  return {
    buffers: live.buffers.map((key) => ({ key })),
    ids: live.ids,
    buses: live.buses,
    sequences: live.sequences,
  };
}

let store: CatalogStore | undefined;

/** The one store all editors are given, so a change to it reaches every editor. */
export function sharedCatalog(): CatalogStore {
  if (!store) {
    const created = createCatalogStore(
      catalogFromNodes(undefined, fromLive(getLiveCatalog())),
    );
    onLiveCatalog((live) => created.update(fromLive(live)));
    store = created;
  }
  return store;
}
