/**
 * The catalog every code editor shares: what a script can use.
 *
 * The node types come from the library's static definitions, without an engine. The sounds, ids, buses
 * and sequences come from the live project (editor/live-catalog.ts) and follow it as scripts run.
 * Euclip's own script functions (`slider`, `waveform`, …) are described from the same declarations the
 * script API is made from (controls/declarations.ts), so the editor completes inside their brackets:
 * selectors, the parameters of the node the first argument names, sequence names, option keys and
 * values, and the members of the control a call returns.
 * This module is only ever loaded with the editor (see editor/load.ts).
 */
import {
  catalogFromNodes,
  createCatalogStore,
  type CatalogStore,
  type EditorCatalog,
  type FunctionInfo,
  type ReturnInfo,
} from 'cracked-up/editor';
import type { LiveCatalog } from 'client-v2/audio/runner';
import {
  CONTROL_FUNCTIONS,
  CONTROL_MEMBERS,
  type SignatureSpec,
} from 'client-v2/controls/declarations';
import { getLiveCatalog, onLiveCatalog } from 'client-v2/editor/live-catalog';

const CONTROL: ReturnInfo = {
  name: 'control',
  description:
    'The declared control: read its value, or move it (and its parameter) from code.',
  members: CONTROL_MEMBERS,
};

const CONTROLS: ReturnInfo = {
  name: 'controls',
  description:
    "The controls declared, by node id and then parameter name: controls()['filter'].frequency.set(800).",
};

function returns(signature: SignatureSpec): ReturnInfo | undefined {
  return signature.returns === 'control'
    ? CONTROL
    : signature.returns === 'controls'
      ? CONTROLS
      : undefined;
}

/** Euclip's script functions as the editor's catalog describes a host's functions. */
export function hostFunctions(): FunctionInfo[] {
  return CONTROL_FUNCTIONS.map((fn) => ({
    name: fn.name,
    description: fn.description,
    signatures: fn.signatures.map((signature) => {
      const result = returns(signature);
      return {
        args: signature.args,
        ...(signature.description === undefined
          ? {}
          : { description: signature.description }),
        ...(result ? { returns: result } : {}),
      };
    }),
  }));
}

const FUNCTIONS = hostFunctions();

function fromLive(live: LiveCatalog): EditorCatalog {
  return {
    functions: FUNCTIONS,
    buffers: live.buffers,
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
