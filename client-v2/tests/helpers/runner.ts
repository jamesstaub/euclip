import {
  createEngine,
  defineNode,
  type Engine,
  type NodeDefinition,
} from 'cracked-up';
import {
  ProjectRunner,
  type RunnerHost,
  type RunnerOptions,
} from 'client-v2/audio/runner';
import { defaultProject } from 'client-v2/project/default-project';
import { applyOperation, type Operation } from 'client-v2/project/operations';
import type { ProjectDocument } from 'client-v2/project/schema';

export const RATE = 44100;

/** A project running on an offline engine: the runner, with a document it can read and write. */
export interface Harness {
  engine: Engine;
  context: OfflineAudioContext;
  runner: ProjectRunner;
  doc: ProjectDocument;
  /** operations that came from scripts (`control.set`): stored, but not steps to undo */
  derived: Operation[];
  /** how many times the runner has said that something the UI shows changed */
  changes: number;
  /** the bytes of audio files the document's pool refers to, by file key */
  files: Map<string, ArrayBuffer>;
  /** what a user action does: change the document, then tell the runner */
  apply(op: Operation | null): void;
  /** a script edit, run at once (the app waits for a pause in typing first) */
  setScript(scope: string, script: string): Promise<void>;
  /** plays from the start and renders the whole context */
  render(): Promise<AudioBuffer>;
}

/**
 * The default project in the form projects were saved in before the project held a track's pattern
 * and its sound: both written in its script (the pattern as an array, the sound as `buffer: 'kick'`),
 * and nothing stored.
 * That form keeps working, and most tests here are about it.
 */
export function arrayDefaultProject(): ProjectDocument {
  const doc = defaultProject();
  return {
    ...doc,
    tracks: doc.tracks.map((track) => {
      const steps = track.values.controls['stepGrid › steps']?.value;
      const sound = track.values.controls['#sampler › buffer']?.value;
      if (!Array.isArray(steps) || typeof sound !== 'string') return track;
      return {
        ...track,
        script: track.script
          .replace(/steps: \d+,/, `steps: [${steps.join(', ')}],`)
          .replace(
            ".sampler({ id: 'sampler' })",
            `.sampler({ id: 'sampler', buffer: '${sound}' })`,
          ),
        values: { controls: {} },
      };
    }),
  };
}

/**
 * Starts a project on an OfflineAudioContext: no sound card, nothing to resume, and it can be rendered
 * faster than real time. The built-in samples are loaded before it resolves.
 */
export async function startProject(
  doc: ProjectDocument = arrayDefaultProject(),
  seconds = 2,
  nodes: readonly NodeDefinition[] = [],
  options: RunnerOptions = {},
  files = new Map<string, ArrayBuffer>(),
  more: Partial<RunnerHost> = {},
): Promise<Harness> {
  const context = new OfflineAudioContext(2, RATE * seconds, RATE);
  const engine = await createEngine({ context, nodes });
  const harness: Harness = {
    engine,
    context,
    doc,
    derived: [],
    changes: 0,
    files,
    runner: undefined as unknown as ProjectRunner,
    apply(op) {
      if (!op) throw new Error('There was no operation to apply.');
      harness.doc = applyOperation(harness.doc, op);
      harness.runner.handle(op);
    },
    async setScript(scope, script) {
      harness.doc = applyOperation(harness.doc, {
        type: 'setScript',
        scope,
        script,
      });
      await harness.runner.run(scope);
    },
    render() {
      engine.transport.start();
      return engine.render();
    },
  };
  const host: RunnerHost = {
    getDoc: () => harness.doc,
    dispatch: (op) => {
      harness.derived.push(op);
      harness.doc = applyOperation(harness.doc, op);
      harness.runner.handle(op, true);
    },
    changed: () => {
      harness.changes++;
    },
    playheadMoved: () => undefined,
    readFile: (id) => Promise.resolve(harness.files.get(id)?.slice(0) ?? null),
    ...more,
  };
  harness.runner = new ProjectRunner(engine, host, options);
  await harness.runner.start();
  await harness.runner.samplesReady();
  return harness;
}

/** Root mean square of a stretch of a rendered buffer, both channels. */
export function rms(
  buffer: AudioBuffer,
  from = 0,
  to = buffer.duration,
): number {
  let sum = 0;
  let count = 0;
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const data = buffer.getChannelData(channel);
    const end = Math.min(data.length, Math.round(to * buffer.sampleRate));
    for (let i = Math.round(from * buffer.sampleRate); i < end; i++) {
      sum += data[i]! * data[i]!;
      count++;
    }
  }
  return count ? Math.sqrt(sum / count) : 0;
}

/** Root mean square of one channel. */
export function channelRms(buffer: AudioBuffer, channel: number): number {
  const data = buffer.getChannelData(channel);
  let sum = 0;
  for (const value of data) sum += value * value;
  return Math.sqrt(sum / data.length);
}

/** The largest absolute sample in a stretch of one channel. */
export function peak(
  buffer: AudioBuffer,
  from: number,
  to: number,
  channel = 0,
): number {
  const data = buffer.getChannelData(channel);
  let max = 0;
  const end = Math.min(data.length, Math.round(to * buffer.sampleRate));
  for (let i = Math.round(from * buffer.sampleRate); i < end; i++) {
    max = Math.max(max, Math.abs(data[i]!));
  }
  return max;
}

/**
 * A node type with a parameter that takes one of a list of values. None of cracked-up's own types has
 * one, so tests of the `select` control bring this.
 */
export const chooser = defineNode({
  type: 'chooser',
  category: 'utility',
  description: 'Passes sound through. For tests: it has a choice parameter.',
  params: {
    shape: { default: 'soft', choices: ['soft', 'hard', 'fold'] },
    amount: { default: 0.5, min: 0, max: 1 },
  },
  build(context) {
    const node = new GainNode(context.audio);
    return {
      input: node,
      output: node,
      params: { shape: () => undefined, amount: node.gain },
    };
  },
});

/** A 16-bit mono WAV file made from a function of time: something to add to a pool as a file. */
export function makeWav(
  seconds: number,
  sample: (t: number) => number,
  rate = RATE,
): ArrayBuffer {
  const frames = Math.round(seconds * rate);
  const bytes = new ArrayBuffer(44 + frames * 2);
  const view = new DataView(bytes);
  const text = (at: number, value: string): void => {
    for (let i = 0; i < value.length; i++)
      view.setUint8(at + i, value.charCodeAt(i));
  };
  text(0, 'RIFF');
  view.setUint32(4, 36 + frames * 2, true);
  text(8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, 'data');
  view.setUint32(40, frames * 2, true);
  for (let i = 0; i < frames; i++) {
    const value = Math.max(-1, Math.min(1, sample(i / rate)));
    view.setInt16(44 + i * 2, Math.round(value * 32767), true);
  }
  return bytes;
}

/**
 * How alike two stretches of samples are, whatever their levels: 1 for the same shape, near 0 for
 * unrelated ones.
 */
export function likeness(a: Float32Array, b: Float32Array): number {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let aa = 0;
  let bb = 0;
  for (let i = 0; i < length; i++) {
    dot += a[i]! * b[i]!;
    aa += a[i]! * a[i]!;
    bb += b[i]! * b[i]!;
  }
  return aa > 0 && bb > 0 ? dot / Math.sqrt(aa * bb) : 0;
}
