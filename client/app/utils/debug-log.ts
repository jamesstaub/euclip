import ENV from 'euclip/config/environment';

// Dev-only, prefixed console logging for tracing track/audio construction.
// Disable with `localStorage.euclipQuiet = '1'`.
export function debugLog(scope: string, ...args: unknown[]): void {
  if (ENV.environment !== 'development') return;
  try {
    if (window.localStorage.getItem('euclipQuiet')) return;
  } catch (_) {
    /* storage unavailable */
  }
  console.log(`[euclip:${scope}]`, ...args);
}
