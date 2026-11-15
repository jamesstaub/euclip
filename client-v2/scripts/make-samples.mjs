/**
 * Makes the built-in drum sounds in public/samples: short synthesised one-shots and one two-bar loop made
 * from them, written as 16-bit mono
 * WAV files. They are generated (nothing here is a recording), so the default project plays with no
 * network and with no sample licence to think about. Run: node scripts/make-samples.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RATE = 44100;
const OUT = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  'samples',
);

// A small seeded noise source, so the files are the same every time the script runs.
function noise(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x80000000 - 1;
  };
}

/** Calls fn(t, i) for every sample of `seconds`, and normalises the result to a peak of `peak`. */
function render(seconds, peak, fn) {
  const data = new Float64Array(Math.round(seconds * RATE));
  for (let i = 0; i < data.length; i++) data[i] = fn(i / RATE, i);
  // a short fade at the end, so nothing clicks
  const fade = Math.min(data.length, Math.round(0.005 * RATE));
  for (let i = 0; i < fade; i++) data[data.length - 1 - i] *= i / fade;
  const max = data.reduce((m, v) => Math.max(m, Math.abs(v)), 0) || 1;
  return data.map((v) => (v / max) * peak);
}

/** A one-pole highpass over a signal function. */
function highpass(cutoff, source) {
  const k = Math.exp((-2 * Math.PI * cutoff) / RATE);
  let low = 0;
  return (t, i) => {
    const x = source(t, i);
    low = (1 - k) * x + k * low;
    return x - low;
  };
}

const sounds = {
  // a sine that drops from 150 Hz to 45 Hz, with a click at the front
  kick: render(0.45, 0.95, (t) => {
    const frequency = 45 + 105 * Math.exp(-t * 28);
    const phase = 2 * Math.PI * (45 * t + (105 / 28) * (1 - Math.exp(-t * 28)));
    return (
      Math.sin(phase) * Math.exp(-t * 7) +
      0.25 * Math.exp(-t * 400) * Math.sign(Math.sin(frequency * t * 40))
    );
  }),
  // noise through a highpass over a short 190 Hz tone
  snare: (() => {
    const hiss = highpass(1200, noise(7));
    return render(
      0.3,
      0.9,
      (t, i) =>
        hiss(t, i) * Math.exp(-t * 22) +
        0.5 * Math.sin(2 * Math.PI * 190 * t) * Math.exp(-t * 30),
    );
  })(),
  // bright noise, very short
  hat: (() => {
    const hiss = highpass(7000, noise(11));
    return render(0.08, 0.8, (t, i) => hiss(t, i) * Math.exp(-t * 70));
  })(),
  // the same noise, left to ring
  openhat: (() => {
    const hiss = highpass(6500, noise(13));
    return render(0.45, 0.8, (t, i) => hiss(t, i) * Math.exp(-t * 9));
  })(),
  // three quick bursts of mid noise, then a tail
  clap: (() => {
    const hiss = highpass(900, noise(17));
    return render(0.32, 0.9, (t, i) => {
      const bursts = [0, 0.011, 0.022].reduce(
        (sum, at) => sum + (t >= at ? Math.exp(-(t - at) * 320) : 0),
        0,
      );
      const tail = t >= 0.03 ? Math.exp(-(t - 0.03) * 24) : 0;
      return hiss(t, i) * (bursts * 0.8 + tail);
    });
  })(),
};

/**
 * A two-bar drum break at 120 beats per minute (4 seconds, 32 sixteenths), put together from the hits
 * above with a little variation in level, so there is something longer to cut into slices. Every hit
 * starts exactly on a sixteenth: a grid of 32 slices, or the onsets, both find them.
 */
sounds.loop = (() => {
  const sixteenth = 60 / 120 / 4;
  const data = new Float64Array(Math.round(32 * sixteenth * RATE));
  const put = (sound, step, level) => {
    const at = Math.round(step * sixteenth * RATE);
    for (let i = 0; i < sound.length && at + i < data.length; i++) {
      data[at + i] += sound[i] * level;
    }
  };
  const kicks = [0, 7, 10, 16, 19, 23, 26];
  const snares = [4, 12, 20, 28, 31];
  const jitter = noise(23);
  for (const step of kicks) put(sounds.kick, step, 0.9);
  for (const step of snares) put(sounds.snare, step, step === 31 ? 0.5 : 0.85);
  for (let step = 0; step < 32; step += 2) {
    put(
      step === 14 || step === 30 ? sounds.openhat : sounds.hat,
      step,
      0.45 + 0.1 * jitter(),
    );
  }
  put(sounds.clap, 28, 0.5);
  const max = data.reduce((m, v) => Math.max(m, Math.abs(v)), 0) || 1;
  const fade = Math.round(0.005 * RATE);
  for (let i = 0; i < fade; i++) data[data.length - 1 - i] *= i / fade;
  return data.map((v) => (v / max) * 0.95);
})();

function wav(samples) {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + samples.length * 2, 4);
  buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(RATE, 24);
  buffer.writeUInt32LE(RATE * 2, 28); // bytes per second
  buffer.writeUInt16LE(2, 32); // bytes per frame
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((value, i) =>
    buffer.writeInt16LE(
      Math.round(Math.max(-1, Math.min(1, value)) * 32767),
      44 + i * 2,
    ),
  );
  return buffer;
}

mkdirSync(OUT, { recursive: true });
for (const [name, samples] of Object.entries(sounds)) {
  writeFileSync(join(OUT, `${name}.wav`), wav(samples));
  console.log(`${name}.wav ${(samples.length / RATE).toFixed(2)}s`);
}
