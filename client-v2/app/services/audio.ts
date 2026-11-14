import Service from '@ember/service';
import { createEngine, type Engine } from 'cracked-up';

/**
 * Owns the app's cracked-up engine.
 *
 * Nothing calls this yet: it exists so the library link is exercised by the bundler and the type checker.
 * The engine is created on first request, because a browser only lets an AudioContext start after the
 * user has pressed something.
 */
export default class AudioService extends Service {
  #engine: Promise<Engine> | undefined;
  #context: AudioContext | undefined;

  /** The engine, created (with its audio context) the first time it is asked for. */
  engine(): Promise<Engine> {
    if (!this.#engine) {
      this.#context = new AudioContext();
      this.#engine = createEngine({ context: this.#context });
    }
    return this.#engine;
  }

  /** Whether `engine()` has been called. */
  get isStarted(): boolean {
    return this.#engine !== undefined;
  }

  willDestroy(): void {
    super.willDestroy();
    void this.#context?.close();
  }
}

declare module '@ember/service' {
  interface Registry {
    audio: AudioService;
  }
}
