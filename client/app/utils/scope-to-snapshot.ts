/**
 * Scripts connect to the project's main output by id (`connect('#main-output')`, and the main output
 * track defines `id: 'main-output'`). Every snapshot has its own main output, and several snapshots'
 * graphs can exist at once (one playing, others built and waiting), so the id is made unique per
 * snapshot when the script is turned into a function. The stored script text is never changed.
 */
export default function scopeToSnapshot(code: string, snapshotId: string | undefined | null): string {
  if (!snapshotId) return code;
  return code.replace(/(?<![\w-])main-output(?![\w-])/g, `main-output-${snapshotId}`);
}
