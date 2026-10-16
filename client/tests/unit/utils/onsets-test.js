import { module, test } from 'qunit';

const SAMPLE_RATE = 44100;

// a deterministic noise generator, so the signals are the same every run
function noise(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2147483648 - 1;
  };
}

// a signal of `seconds` with a decaying noise burst (a drum-like hit) at each [time, amplitude]
function hits(seconds, list) {
  const out = new Float32Array(Math.floor(SAMPLE_RATE * seconds));
  const random = noise(1);
  list.forEach(([time, amplitude]) => {
    const start = Math.floor(time * SAMPLE_RATE);
    for (let i = 0; i < SAMPLE_RATE * 0.12 && start + i < out.length; i++) {
      out[start + i] +=
        amplitude * random() * Math.exp(-i / (SAMPLE_RATE * 0.02));
    }
  });
  return out;
}

// the detector is a plain script (it is also the Web Worker's code), so load it with a <script> tag
function loadDetector() {
  if (window.EuclipOnsets) return Promise.resolve(window.EuclipOnsets);
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/workers/onsets.js';
    script.onload = () => resolve(window.EuclipOnsets);
    script.onerror = () =>
      reject(new Error('could not load /workers/onsets.js'));
    document.head.appendChild(script);
  });
}

module('Unit | Utility | onset detection', function () {
  test('finds each hit, within a few milliseconds', async function (assert) {
    const { detect } = await loadDetector();
    const times = [0.2, 0.5, 0.9, 1.4];
    const found = detect(
      hits(
        2,
        times.map((t) => [t, 1])
      ),
      SAMPLE_RATE,
      0.3
    );

    assert.strictEqual(found.length, 4, 'one onset per hit');
    times.forEach((time, i) => {
      assert.ok(
        Math.abs(found[i] - time) < 0.01,
        `onset ${i} at ${found[i].toFixed(3)}s is within 10 ms of ${time}s`
      );
    });
  });

  test('the threshold decides whether quiet hits count', async function (assert) {
    const { analyze, pick } = await loadDetector();
    const analysis = analyze(
      hits(2, [
        [0.2, 1],
        [0.5, 0.15],
        [0.9, 1],
        [1.4, 0.15],
      ]),
      SAMPLE_RATE
    );

    assert.strictEqual(
      pick(analysis, 0.2).length,
      4,
      'a low threshold finds the quiet hits too'
    );
    assert.strictEqual(
      pick(analysis, 0.5).length,
      2,
      'a high threshold keeps only the loud ones'
    );
    assert.deepEqual(
      pick(analysis, 0.5).map((t) => Math.round(t * 10)),
      [2, 9],
      'and they are the loud ones'
    );
  });

  test('silence, a steady tone and steady noise have no onsets', async function (assert) {
    const { detect } = await loadDetector();
    const tone = new Float32Array(SAMPLE_RATE * 2).map(
      (_, i) => 0.5 * Math.sin((2 * Math.PI * 440 * i) / SAMPLE_RATE)
    );
    const random = noise(7);
    const steady = new Float32Array(SAMPLE_RATE * 2).map(() => 0.3 * random());

    assert.deepEqual(
      detect(new Float32Array(SAMPLE_RATE * 2), SAMPLE_RATE, 0.1),
      [],
      'silence'
    );
    assert.deepEqual(detect(tone, SAMPLE_RATE, 0.1), [], 'a tone');
    assert.deepEqual(detect(steady, SAMPLE_RATE, 0.1), [], 'noise');
  });

  test('never reports the start or the end of the file, and hits too close together are one', async function (assert) {
    const { detect } = await loadDetector();
    const found = detect(
      hits(1, [
        [0.0, 1],
        [0.4, 1],
        [0.415, 1],
        [0.99, 1],
      ]),
      SAMPLE_RATE,
      0.2
    );

    assert.ok(
      found.every((t) => t > 0.01 && t < 0.98),
      'nothing at the very start or end'
    );
    assert.strictEqual(
      found.filter((t) => t > 0.38 && t < 0.45).length,
      1,
      'two hits 15 ms apart are one onset'
    );
  });

  test('a signal shorter than one frame does not break it', async function (assert) {
    const { detect } = await loadDetector();
    assert.deepEqual(detect(new Float32Array(100), SAMPLE_RATE, 0.3), []);
    assert.deepEqual(detect(new Float32Array(0), SAMPLE_RATE, 0.3), []);
  });
});
