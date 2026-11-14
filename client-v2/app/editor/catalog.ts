/**
 * The catalog every code editor shares: what a script can use (node types, buffers, buses).
 *
 * It is built from the library's static node definitions, without an engine or an audio context.
 * This module is only ever loaded with the editor (see editor/load.ts).
 */
import {
  catalogFromNodes,
  createCatalogStore,
  type CatalogStore,
  type EditorCatalog,
} from 'cracked-up/editor';
import { BUFFERS } from 'client-v2/utils/placeholder-tracks';

/** The placeholder project's catalog: the built-in types, its sounds and the bus its tracks send to. */
export function placeholderCatalog(): EditorCatalog {
  return catalogFromNodes(undefined, {
    buffers: BUFFERS.map((key) => ({ key })),
    buses: ['drums'],
  });
}

let store: CatalogStore | undefined;

/** The one store all editors are given, so a change to it reaches every editor. */
export function sharedCatalog(): CatalogStore {
  return (store ??= createCatalogStore(placeholderCatalog()));
}
