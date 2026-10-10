// Resolves once `predicate()` is true. Polls, so unlike ember-concurrency's waitForProperty it also
// works for tracked fields and getters that never notify observers (those waits can hang forever).
export default function waitUntil(
  predicate: () => boolean,
  { timeout = 15_000, interval = 25 }: { timeout?: number; interval?: number } = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const check = () => {
      if (predicate()) return resolve();
      if (Date.now() - started > timeout) return reject(new Error('Timed out waiting for condition'));
      setTimeout(check, interval);
    };
    check();
  });
}
