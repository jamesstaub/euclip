/**
 * The sample pool: naming a sound a person adds, and the limit on its size. Pure.
 */

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
