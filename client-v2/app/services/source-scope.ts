import Service, { service } from '@ember/service';
import { TapSet } from 'cracked-up/inspect';
import type AudioService from 'client-v2/services/audio';

/** One oscilloscope on screen: a canvas, and the source node whose output it draws. */
interface Scope {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D | null;
  key: string;
  scopeId: string;
  nodeId: string;
  visible: boolean;
  /** the canvas's size in device pixels, kept by the resize observer, never read per frame */
  width: number;
  height: number;
  background: string;
  trace: string;
  grid: string;
  /** the vertical scale, eased so a level that changes does not make the picture jump */
  scale: number;
}

/** Samples read at each tap: 2048 is 43 ms at 48 kHz, room for a few periods of anything down to ~70 Hz. */
const SIZE = 2048;
/** The part of a reading that is drawn, from the trigger on: it has to fit after the trigger point. */
const SHOWN = SIZE / 2;
/** Reduced motion: the picture is redrawn this often, in seconds, instead of every frame. */
const STILL_SECONDS = 0.25;
/** Below this peak the signal is taken as silence: a flat line, and the loop may rest. */
const SILENT = 0.002;

/**
 * The oscilloscopes of the source tab's synth editors, all drawn from one animation loop.
 *
 * Each shows its source node's own output as a time-domain trace. It listens the way the signal chain
 * pictures do: cracked-up/inspect's `TapSet`, an analyser that hangs off the node's output and leads
 * nowhere, so the sound is untouched. (cracked-up exports the tap and the level meters but no scope
 * drawing, so the trace is drawn here on a canvas.) The trace is triggered on a rising zero crossing, so a
 * steady tone stands still.
 *
 * Cost: taps exist only for scopes on screen (IntersectionObserver); the one `requestAnimationFrame`
 * loop runs only while a scope is visible, the audio context is running and the page is shown, and
 * rests once everything has been silent for a second (`poke` starts it again: a note, the transport, a
 * rebuild). Drawing allocates nothing and writes no tracked state, so Glimmer never re-renders for it.
 */
export default class SourceScopeService extends Service {
  @service declare audio: AudioService;

  readonly #scopes = new Map<HTMLCanvasElement, Scope>();
  readonly #wanted = new Map<string, AudioNode>();
  #taps: TapSet | null = null;
  #observer: IntersectionObserver | null = null;
  #raf = 0;
  #last = 0;
  #still = 0;
  #quiet = 0;

  /** For tests: act as if the context is running (an offline one never is), and as if motion is reduced. */
  forceRunning = false;
  reducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** For tests: how many frames were drawn. */
  frames = 0;
  /** For tests: the peak of the last trace drawn (0 for silence). */
  lastPeak = 0;

  #onVisibility = (): void => this.poke();
  /** the context being watched for starting to run (resume() is asynchronous: a poke that came first found it still asleep) */
  #watched: BaseAudioContext | null = null;
  #onState = (): void => this.poke();

  constructor(owner: ConstructorParameters<typeof Service>[0]) {
    super(owner);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.#onVisibility);
    }
  }

  willDestroy(): void {
    super.willDestroy();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.#onVisibility);
    }
    cancelAnimationFrame(this.#raf);
    this.#observer?.disconnect();
    this.#taps?.clear();
    this.#watched?.removeEventListener('statechange', this.#onState);
  }

  get tapCount(): number {
    return this.#taps?.count ?? 0;
  }

  get visibleCount(): number {
    let count = 0;
    for (const scope of this.#scopes.values()) if (scope.visible) count++;
    return count;
  }

  get looping(): boolean {
    return this.#raf !== 0;
  }

  /** A scope's canvas exists: it is drawn while on screen. Returns what to call when it goes. */
  register(
    canvas: HTMLCanvasElement,
    scopeId: string,
    nodeId: string,
  ): () => void {
    const style = getComputedStyle(canvas);
    const colour = (name: string, fallback: string): string =>
      style.getPropertyValue(name).trim() || fallback;
    const scope: Scope = {
      canvas,
      ctx: canvas.getContext('2d'),
      key: `${scopeId}/${nodeId}`,
      scopeId,
      nodeId,
      visible: false,
      width: 0,
      height: 0,
      background: colour('--scope-bg', '#333'),
      trace: colour('--scope-trace', '#30e7ff'),
      grid: colour('--scope-grid', '#555'),
      scale: 1,
    };
    this.#scopes.set(canvas, scope);
    const resize = (): void => {
      const ratio = window.devicePixelRatio || 1;
      scope.width = Math.max(1, Math.round(canvas.clientWidth * ratio));
      scope.height = Math.max(1, Math.round(canvas.clientHeight * ratio));
      canvas.width = scope.width;
      canvas.height = scope.height;
      this.#draw(scope, null);
    };
    const resizer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => resize());
    resizer?.observe(canvas);
    resize();
    if (typeof IntersectionObserver === 'undefined') {
      scope.visible = true;
    } else {
      this.#observer ??= new IntersectionObserver((records) => {
        for (const record of records) {
          const seen = this.#scopes.get(record.target as HTMLCanvasElement);
          if (seen) seen.visible = record.isIntersecting;
        }
        this.poke();
      });
      this.#observer.observe(canvas);
    }
    this.poke();
    return () => {
      resizer?.disconnect();
      this.#observer?.unobserve(canvas);
      this.#scopes.delete(canvas);
      this.#taps?.remove(scope.key);
      this.poke();
    };
  }

  /** Something that may start or stop the work changed: look again, and start the loop if it is wanted. */
  poke(): void {
    this.#quiet = 0;
    const context = this.audio.engine?.context;
    if (context && context !== this.#watched) {
      this.#watched?.removeEventListener('statechange', this.#onState);
      this.#watched = context;
      context.addEventListener('statechange', this.#onState);
    }
    if (this.#raf === 0 && this.#wantsLoop()) {
      this.#last = performance.now();
      this.#raf = requestAnimationFrame(this.#tick);
    }
  }

  #running(): boolean {
    const engine = this.audio.engine;
    if (!engine) return false;
    return (
      this.forceRunning ||
      (!engine.offline && engine.context.state === 'running')
    );
  }

  #wantsLoop(): boolean {
    if (typeof document !== 'undefined' && document.hidden) return false;
    return this.visibleCount > 0 && this.#running();
  }

  #tick = (now: number): void => {
    this.#raf = 0;
    const dt = Math.min(0.1, Math.max(0, (now - this.#last) / 1000));
    this.#last = now;
    if (!this.#wantsLoop()) {
      this.release();
      return;
    }
    const active = this.step(dt);
    this.#quiet = active ? 0 : this.#quiet + dt;
    if (this.#quiet > 1) {
      this.release();
      return;
    }
    this.#raf = requestAnimationFrame(this.#tick);
  };

  /** Stops listening: no taps, and the loop rests until the next `poke`. */
  release(): void {
    cancelAnimationFrame(this.#raf);
    this.#raf = 0;
    this.#taps?.clear();
  }

  /**
   * One frame: taps for what is on screen, one reading and one drawing per scope. Returns whether
   * anything is still sounding. Called by the loop; tests call it directly.
   */
  step(dt: number): boolean {
    const engine = this.audio.engine;
    if (!engine) return false;
    if (this.reducedMotion) {
      this.#still += dt;
      if (this.#still < STILL_SECONDS) return true;
      dt = this.#still;
      this.#still = 0;
    }
    const wanted = this.#wanted;
    wanted.clear();
    for (const scope of this.#scopes.values()) {
      if (!scope.visible) continue;
      const node = this.audio.nodeById(scope.scopeId, scope.nodeId);
      const output = node && !node.disposed ? node.output : null;
      if (output) wanted.set(scope.key, output);
    }
    if (wanted.size > 0 && !this.#taps) {
      this.#taps = new TapSet(engine.context, SIZE);
    }
    this.#taps?.sync(wanted, dt);
    let active = false;
    for (const scope of this.#scopes.values()) {
      if (!scope.visible) continue;
      const samples = wanted.has(scope.key)
        ? (this.#taps?.read(scope.key) ?? null)
        : null;
      if (this.#draw(scope, samples)) active = true;
    }
    this.frames++;
    return active;
  }

  /** Draws one scope: the reading from its rising zero crossing, or a flat line for none. Returns whether it is not silent. */
  #draw(scope: Scope, samples: Float32Array | null): boolean {
    const ctx = scope.ctx;
    if (!ctx) return false;
    const { width, height } = scope;
    ctx.fillStyle = scope.background;
    ctx.fillRect(0, 0, width, height);
    const middle = height / 2;
    ctx.lineWidth = 1;
    ctx.strokeStyle = scope.grid;
    ctx.beginPath();
    ctx.moveTo(0, Math.round(middle) + 0.5);
    ctx.lineTo(width, Math.round(middle) + 0.5);
    ctx.stroke();

    let peak = 0;
    let start = 0;
    if (samples) {
      let crossing = -1;
      for (let i = 0; i < samples.length; i++) {
        const value = Math.abs(samples[i]!);
        if (value > peak) peak = value;
        if (
          crossing < 0 &&
          i > 0 &&
          i <= SIZE - SHOWN &&
          samples[i - 1]! < 0 &&
          samples[i]! >= 0
        ) {
          crossing = i;
        }
      }
      if (crossing >= 0) start = crossing;
      else start = 0;
    }
    this.lastPeak = peak;
    const silent = peak < SILENT;
    // a flat line for silence; a signal is scaled to fill most of the height, easing between frames
    const target = silent ? 1 : Math.min(8, 0.9 / peak);
    scope.scale += (target - scope.scale) * 0.2;
    ctx.lineWidth = Math.max(1, Math.round(window.devicePixelRatio || 1) * 1.5);
    ctx.strokeStyle = scope.trace;
    ctx.beginPath();
    if (silent || !samples) {
      ctx.moveTo(0, middle);
      ctx.lineTo(width, middle);
    } else {
      const half = (height / 2) * 0.95;
      const step = SHOWN / width;
      for (let x = 0; x < width; x++) {
        const value = samples[start + Math.floor(x * step)] ?? 0;
        const y =
          middle - Math.max(-1, Math.min(1, value * scope.scale)) * half;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    return !silent;
  }
}

declare module '@ember/service' {
  interface Registry {
    'source-scope': SourceScopeService;
  }
}
