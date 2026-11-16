/**
 * The project's sounds (the pool): naming a sound that joins the project, telling where a sound comes
 * from and what uses it, and the limit on a file's size. Pure.
 *
 * A project sound is a name a script can type (`buffer: 'kick'`) pointing at one source: a file of the
 * library, a built-in, or one of the person's own files. The name is the project's; the source may be
 * in several projects, and in one project under several names (the same file cut two ways).
 */
import { BUFFER_OPTION } from 'client-v2/controls/declarations';
import {
  PROJECT_SCOPE,
  type ProjectDocument,
  type SampleSource,
} from 'client-v2/project/schema';

/** The largest file that can be added: bigger ones are refused before anything is read into memory twice. */
export const MAX_FILE_BYTES = 30 * 1024 * 1024;

/** The limit as people say it. */
export const MAX_FILE_TEXT = '30 MB';

/**
 * The name a file gets in the pool: what a script writes in `buffer: '…'`. Lower-case letters, digits
 * and underscores, starting with a letter, and not a name the pool already has (a number is added).
 */
export function sampleNameFor(
  fileName: string,
  taken: Iterable<string>,
): string {
  const stem = fileName.replace(/\.[a-z0-9]{1,5}$/i, '');
  let base = stem
    .normalize('NFKD')
    .replace(/[^\x20-\x7e]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);
  if (base === '') base = 'sound';
  if (!/^[a-z]/.test(base)) base = `s_${base}`;
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}_${n}`;
    if (!used.has(candidate)) return candidate;
  }
}

/** A key for a file's bytes in the file store. Never reused. */
export function newFileId(): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `f-${random}`;
}

/** Why a file could not be added, in words for the person. */
export function refusal(file: {
  name: string;
  size: number;
  type: string;
}): string | null {
  if (file.size > MAX_FILE_BYTES) {
    return `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB. The most a sound can be is ${MAX_FILE_TEXT}.`;
  }
  if (file.size === 0) return `"${file.name}" is empty.`;
  return null;
}

/** What a project sound points at, as one string: the same source gives the same string. */
export function sourceId(source: SampleSource): string {
  if (source.library !== undefined) return `library:${source.library}`;
  if (source.file !== undefined) return `file:${source.file}`;
  return `url:${source.url ?? ''}`;
}

/** The project sound that already points at a source, if there is one: joining twice reuses it. */
export function nameOfSource(
  samples: Readonly<Record<string, SampleSource>>,
  id: string,
): string | undefined {
  return Object.keys(samples).find((name) => sourceId(samples[name]!) === id);
}

/** Why a name cannot be a project sound's, in words; null when it can. */
export function nameProblem(
  name: string,
  taken: Iterable<string>,
): string | null {
  if (name === '') return 'A sound needs a name.';
  if (!/^[a-z][a-z0-9_]*$/.test(name)) {
    return 'A name is lower-case letters, digits and underscores, starting with a letter: it is what a script types.';
  }
  if (name.length > 32) return 'A name is at most 32 characters.';
  if (new Set(taken).has(name))
    return `There is already a sound called '${name}'.`;
  return null;
}

const escaped = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** `buffer: 'name'` (or with double quotes) in a script: how a script names the sound a sampler plays. */
function naming(name: string): RegExp {
  return new RegExp(`(\\bbuffer\\s*:\\s*)(['"])${escaped(name)}\\2`, 'g');
}

/** A script with every `buffer: 'from'` written as `buffer: 'to'`. */
export function renameInScript(
  script: string,
  from: string,
  to: string,
): string {
  return script.replace(naming(from), `$1$2${to}$2`);
}

export interface SoundUse {
  /** a track's id, or the project scope */
  scope: string;
  /** "Track 3", "Main output" */
  label: string;
  /** how many times its script names the sound */
  written: number;
  /** a sampler of it has the sound by the person's choice (stored), whatever its script says */
  chosen: boolean;
}

/** Where a project sound is used: by a script that names it, or by a sampler it was chosen for. */
export function usesOf(doc: ProjectDocument, name: string): SoundUse[] {
  const scopes = [
    ...doc.tracks.map((track, index) => ({
      scope: track.id,
      label: `Track ${index + 1}`,
      script: track.script,
      values: track.values,
    })),
    {
      scope: PROJECT_SCOPE,
      label: 'Main output',
      script: doc.script,
      values: doc.values,
    },
  ];
  const uses: SoundUse[] = [];
  for (const { scope, label, script, values } of scopes) {
    const written = script.match(naming(name))?.length ?? 0;
    const chosen = Object.entries(values.controls).some(
      ([key, state]) =>
        key.endsWith(` › ${BUFFER_OPTION}`) && state.value === name,
    );
    if (written > 0 || chosen) uses.push({ scope, label, written, chosen });
  }
  return uses;
}
