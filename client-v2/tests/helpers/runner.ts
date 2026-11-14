import { createEngine, type Engine } from 'cracked-up';
import { ProjectRunner } from 'client-v2/audio/runner';
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
  /** operations the runner derived itself (dropped overrides) */
  derived: Operation[];
  /** what a user action does: change the document, then tell the runner */
  apply(op: Operation | null): void;
  /** a script edit, run at once (the app waits for a pause in typing first) */
  setScript(scope: string, script: string): Promise<void>;
  /** plays from the start and renders the whole context */
  render(): Promise<AudioBuffer>;
}

/**
 * Starts a project on an OfflineAudioContext: no sound card, nothing to resume, and it can be rendered
 * faster than real time. The built-in samples are loaded before it resolves.
 */
export async function startProject(
  doc: ProjectDocument = defaultProject(),
  seconds = 2,
): Promise<Harness> {
  const context = new OfflineAudioContext(2, RATE * seconds, RATE);
  const engine = await createEngine({ context });
  const harness: Harness = {
    engine,
    context,
    doc,
    derived: [],
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
  harness.runner = new ProjectRunner(engine, {
    getDoc: () => harness.doc,
    dispatch: (op) => {
      harness.derived.push(op);
      harness.doc = applyOperation(harness.doc, op);
    },
    changed: () => undefined,
    playheadMoved: () => undefined,
  });
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
