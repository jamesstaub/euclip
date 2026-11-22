/**
 * The project's sounds: loading the pool's audio into the engine's buffer store (a URL, the library, or
 * a file the person added), keeping decoded audio so a source is decoded once, slices, retrying a sound
 * that failed, which sounds are missing, and hearing a sound that is not in the project.
 */

import type { BufferRef, Node } from 'cracked-up';
import { normalizeSlices } from 'cracked-up/util';
import { BUFFER_OPTION } from 'client-v2/controls/declarations';
import { sameValue } from 'client-v2/project/operations';
import { sourceId } from 'client-v2/project/pool';
import { type ProjectDocument } from 'client-v2/project/schema';
import { ownNodes } from 'client-v2/audio/runner/access';
import type { RunnerContext } from 'client-v2/audio/runner/context';

/** The scope and the buffer Euclip hears a sound with (`ProjectRunner.hear`): not a project's. */
const HEAR_SCOPE = '~hear';
const HEAR_KEY = '~hear';
/** How many decoded sounds are kept beyond those the project uses. */
const DECODED_KEPT = 32;

export class SoundLibrary {
  readonly ctx: RunnerContext;

  constructor(ctx: RunnerContext) {
    this.ctx = ctx;
  }

  readonly loadedSamples = new Map<string, string>();
  /** the document's slices are being given to a sound: not a change to send back to the document */
  #settingSlices = false;
  readonly #missing = new Set<string>();
  readonly #reading = new Set<Promise<void>>();

  /** A sound arrived in the buffer store: what depends on it follows. */
  onReady(ref: BufferRef): void {
    // (a single sample is the stand-in a missing file's name is given: not its audio)
    const real = ref.buffer !== null && ref.buffer.length > 1;
    if (real) this.#missing.delete(ref.key);
    const from = this.loadedSamples.get(ref.key);
    if (from !== undefined && ref.buffer && real) {
      this.#decoded.set(from, ref.buffer);
    }
    this.applySlices(ref.key);
    // (a speed synced to a sequence needs the sound's length: here it is)
    for (const runtime of this.ctx.scopes.values()) {
      this.ctx.parts.sync.resync(runtime);
    }
    this.ctx.host.changed();
  }

  /**
   * Brings the engine's buffer store in line with the document's pool: loads what is new (a URL, or
   * the bytes of a file the person added), and gives every sound the slices the document holds for it.
   */
  loadSamples(doc: ProjectDocument): void {
    for (const name of [...this.loadedSamples.keys()]) {
      if (!(name in doc.samples)) {
        // no longer a sound of the project: its audio stays decoded (another name, or a preview, may
        // want it), its name is free again
        this.loadedSamples.delete(name);
        this.#missing.delete(name);
        this.ctx.engine.buffers.delete(name);
      }
    }
    for (const [name, source] of Object.entries(doc.samples)) {
      const from = sourceId(source);
      if (this.loadedSamples.get(name) !== from) {
        this.loadedSamples.set(name, from);
        this.#missing.delete(name);
        const decoded = this.#decoded.get(from);
        if (decoded) {
          // heard already, or in the project under another name: decoded once, shared
          this.ctx.engine.buffers.add(name, decoded);
        } else if (source.file !== undefined) {
          // not awaited: a sampler without its sound yet is silent, and plays once it arrives
          const reading = this.loadFile(name, source.file).finally(() =>
            this.#reading.delete(reading),
          );
          this.#reading.add(reading);
        } else {
          const url =
            source.library !== undefined
              ? this.ctx.host.libraryUrl?.(source.library)
              : source.url;
          if (url !== undefined)
            this.ctx.engine.buffers.load(url, { key: name });
        }
      }
      this.applySlices(name);
    }
  }

  /** Audio already decoded, by where it comes from (pool.ts `sourceId`): a source is decoded once. */
  readonly #decoded = new Map<string, AudioBuffer>();

  /** The decoded audio of a source, if it has been decoded: for hearing it without loading it again. */
  decoded(source: string): AudioBuffer | undefined {
    return this.#decoded.get(source);
  }

  /** Keeps audio decoded elsewhere (a preview): a project sound on the same source will use it. */
  keepDecoded(source: string, buffer: AudioBuffer): void {
    this.#decoded.delete(source);
    this.#decoded.set(source, buffer);
    // Heard sounds are kept so that using one does not decode it again, but not without end: beyond
    // a few dozen the oldest that no project sound is on are let go.
    if (this.#decoded.size > DECODED_KEPT) {
      const inUse = new Set(this.loadedSamples.values());
      for (const key of this.#decoded.keys()) {
        if (this.#decoded.size <= DECODED_KEPT) break;
        if (!inUse.has(key) && key !== source) this.#decoded.delete(key);
      }
    }
  }

  /**
   * Tries again to give a project sound its audio: one that failed to load, or one whose file has been
   * supplied again. The new audio goes into the entry the name already has, so the samplers that play
   * it have it at once (a sampler keeps the entry it found; it does not look a name up again).
   */
  async retrySample(name: string): Promise<void> {
    const source = this.ctx.host.getDoc().samples[name];
    if (!source) return;
    const from = sourceId(source);
    let decoded = this.#decoded.get(from);
    if (!decoded) {
      let bytes: ArrayBuffer | null = null;
      try {
        if (source.file !== undefined) {
          bytes = (await this.ctx.host.readFile?.(source.file)) ?? null;
        } else {
          const url =
            source.library !== undefined
              ? this.ctx.host.libraryUrl?.(source.library)
              : source.url;
          const response = url === undefined ? null : await fetch(url);
          bytes = response?.ok ? await response.arrayBuffer() : null;
        }
        if (bytes)
          decoded = await this.ctx.engine.context.decodeAudioData(bytes);
      } catch {
        // (as it was: still failed)
      }
    }
    if (!decoded) {
      this.ctx.host.changed();
      return;
    }
    this.#decoded.set(from, decoded);
    this.loadedSamples.set(name, from);
    this.#missing.delete(name);
    const ref = this.ctx.engine.buffers.add(name, decoded);
    // A sampler keeps the entry it found under a name, and the name now has another. Being given the
    // same name again is no change to the library, so the samplers that play it are given it by way
    // of another sound, in the same instant.
    const other = this.ctx.engine.buffers
      .list()
      .find((entry) => entry.key !== name && entry.state === 'ready');
    for (const runtime of this.ctx.scopes.values()) {
      for (const node of ownNodes(runtime)) {
        if (node.buffer && node.buffer !== ref && node.buffer.key === name) {
          if (other) node.setOption(BUFFER_OPTION, other.key);
          node.setOption(BUFFER_OPTION, name);
        }
      }
    }
    this.applySlices(name);
    // (a speed synced to a sequence needs the sound's length)
    for (const runtime of this.ctx.scopes.values())
      this.ctx.parts.sync.resync(runtime);
    this.ctx.host.changed();
  }

  /**
   * Resolves when every added file being read has been handed to the buffer store (decoding goes on).
   * Scripts run after this: a sampler made before its sound has an entry would look for a URL of that
   * name instead.
   */
  async filesRead(): Promise<void> {
    await Promise.allSettled([...this.#reading]);
  }

  async loadFile(name: string, file: string): Promise<void> {
    const have = this.ctx.engine.buffers.get(name);
    if (have && have.state === 'ready') return; // (added a moment ago, already decoded)
    const bytes = (await this.ctx.host.readFile?.(file)) ?? null;
    if (this.loadedSamples.get(name) !== `file:${file}`) return;
    const decoded = this.#decoded.get(`file:${file}`);
    if (decoded) {
      this.ctx.engine.buffers.add(name, decoded);
      return;
    }
    if (!bytes) {
      console.warn(
        `Euclip: the audio of "${name}" is not in this browser's storage.`,
      );
      this.#missing.add(name);
      // The name still gets an entry (a moment of silence): a sampler given a name with no entry
      // would go looking for a file of that name, and would not look again when the audio comes.
      if (!this.ctx.engine.buffers.get(name)) {
        this.ctx.engine.buffers.add(
          name,
          this.ctx.engine.context.createBuffer(
            1,
            1,
            this.ctx.engine.context.sampleRate,
          ),
        );
      }
      this.ctx.host.changed();
      return;
    }
    // (decoding detaches the bytes it is given: hand it a copy)
    this.ctx.engine.buffers.add(name, bytes.slice(0));
  }

  /** Gives a sound of the pool the slices the document holds for it (none: one slice, the whole sound). */
  applySlices(name: string): void {
    const ref = this.ctx.engine.buffers.get(name);
    const source = this.ctx.host.getDoc().samples[name];
    if (!ref || !source || ref.duration === null) return;
    const wanted = normalizeSlices(
      source.slices ?? [0, ref.duration],
      ref.duration,
    );
    const slices = wanted.length >= 2 ? wanted : [0, ref.duration];
    if (!sameValue([...ref.slices], slices)) {
      this.#settingSlices = true;
      try {
        ref.slices = slices;
      } finally {
        this.#settingSlices = false;
      }
    }
  }

  /**
   * A sound's slices were changed by something other than the document (a script: `ref.slices = …`).
   * They are the sound's, so the document takes them: stored, but not a step to undo.
   */
  onSlices(ref: BufferRef): void {
    if (this.#settingSlices) return;
    const source = this.ctx.host.getDoc().samples[ref.key];
    if (source) {
      this.ctx.host.dispatch({
        type: 'setSampleSlices',
        name: ref.key,
        slices: [...ref.slices],
      });
    }
    this.ctx.host.changed();
  }

  /** Sounds of the pool whose audio could not be found or read. */
  /** The project sounds whose file is not on this browser's shelf (as against one that failed to load or decode). */
  missingFiles(): string[] {
    return [...this.#missing];
  }

  missingSamples(): string[] {
    const missing = new Set(this.#missing);
    for (const name of Object.keys(this.ctx.host.getDoc().samples)) {
      if (this.ctx.engine.buffers.get(name)?.state === 'error')
        missing.add(name);
    }
    return [...missing];
  }

  #hearing: Node | null = null;

  /**
   * Plays decoded audio for the ear, through the app's main output, without the transport and without
   * touching the project: a sampler of Euclip's own, in a scope of its own. One sound at a time.
   *
   * Each sound is given to the sampler under a key of its own. (A sampler keeps the entry it found
   * under a key: putting new audio under one fixed key left it playing the first sound for ever.) The
   * key before it is dropped, so nothing piles up in the buffer store.
   */
  async hear(buffer: AudioBuffer): Promise<void> {
    const key = `${HEAR_KEY}:${++this.#hears}`;
    this.ctx.engine.buffers.add(key, buffer);
    if (!this.#hearing) {
      const scope = this.ctx.engine.scope(HEAR_SCOPE);
      await scope.build((api) => {
        api().sampler({ id: 'hear', buffer: key }).to('main');
      });
      this.#hearing = [...scope.select('#hear')][0] ?? null;
    }
    const node = this.#hearing;
    if (!node) return;
    this.stopHearing();
    node.setOption(BUFFER_OPTION, key);
    const before = this.#hearKey;
    this.#hearKey = key;
    if (before !== null && before !== key)
      this.ctx.engine.buffers.delete(before);
    node.trigger({});
  }
  #hears = 0;
  #hearKey: string | null = null;

  /** The audio the hearing sampler has now: what the last `hear` plays. For tests and drivers. */
  get heard(): AudioBuffer | null {
    return this.#hearing?.buffer?.buffer ?? null;
  }

  stopHearing(): void {
    try {
      this.#hearing?.release();
    } catch {
      // (nothing sounding)
    }
  }

  /** Resolves when every sound of the pool has loaded (or failed). For tests and offline rendering. */
  async samplesReady(): Promise<void> {
    await Promise.allSettled(
      Object.keys(this.ctx.host.getDoc().samples).map(
        (name) => this.ctx.engine.buffers.get(name)?.ready ?? Promise.resolve(),
      ),
    );
  }
}
