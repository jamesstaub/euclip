import Service, { service } from '@ember/service';
import { LevelMeter, RangeMeter, TapSet, measure } from 'cracked-up/inspect';
import type { BlockStats } from 'cracked-up/inspect';
import type { Node } from 'cracked-up';
import type AudioService from 'client-v2/services/audio';

/** One thing in a chain picture that shows a level: an element that takes `--level`, and the node it listens to. */
interface Entry {
  key: string;
  /** the node's id and where to find it again if it is rebuilt */
  scopeId: string;
  nodeId: string;
  node: Node | undefined;
  control: boolean;
  /** an audio node met some other way than by id (a track's channel output): looked up each frame */
  resolve?: () => AudioNode | null;
  /** the elements that show it: the link after the node, and the chip at the end of the row (if this is its last node) */
  elements: HTMLElement[];
  shown: number;
  live: boolean;
}

interface Pane {
  root: HTMLElement;
  scopeId: string;
  visible: boolean;
  entries: Entry[];
}

/** Levels are shown in steps this fine: a style is written only when the step changes. */
const STEPS = 50;
/** The lowest level shown, in dB (the meter's own floor is -60). */
const FLOOR_DB = -48;
/** A level above this is signal "flowing": the line animates. */
const FLOW_AT = 0.06;
/** Reduced motion: levels are redrawn this often instead of every frame, and nothing animates. */
const STILL_SECONDS = 0.25;

/**
 * Levels for the signal chain pictures, drawn the way cracked-up's inspector draws them: a tap
 * (`TapSet`, an analyser hanging off a node's output and leading nowhere, so the sound is untouched)
 * on each node that is on screen, `measure` and `LevelMeter` (a `RangeMeter` for control signals) for
 * what it reads. Everything cracked-up/inspect offers for this is exported and used as it is.
 *
 * What differs from the inspector, which paints one canvas: here the pictures are ordinary elements, so
 * each reading is written as the CSS variable `--level` on the existing element (the link after the
 * node, and the chip where the row ends), once, in steps, only when the step changes. Nothing tracked
 * is written, so nothing re-renders per frame.
 *
 * Cost: taps exist only for panes that are on screen (IntersectionObserver) and are made on demand;
 * the one `requestAnimationFrame` loop runs only while something is visible, the context is running and
 * (playing or still falling to silence), and stops by itself otherwise. Every frame looks the nodes up
 * again from the cached ones (a rebuilt scope gives new nodes: `disposed` is the sign), and `TapSet.sync`
 * moves or removes taps that point at nodes that are gone.
 */
export default class ChainMetersService extends Service {
  @service declare audio: AudioService;

  readonly #panes = new Map<HTMLElement, Pane>();
  readonly #meters = new Map<string, LevelMeter | RangeMeter>();
  readonly #wanted = new Map<string, AudioNode>();
  readonly #block: BlockStats = { peak: 0, rms: 0, min: 0, max: 0, last: 0 };
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

  /** For tests and for measuring: how long the last frames took, in ms. */
  stats = { frames: 0, total: 0, worst: 0 };

  #onVisibility = (): void => this.poke();

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
  }

  /** How many taps exist now (for the tests, and the report). */
  get tapCount(): number {
    return this.#taps?.count ?? 0;
  }

  /** How many chain pictures are on screen now. */
  get visibleCount(): number {
    let count = 0;
    for (const pane of this.#panes.values()) if (pane.visible) count++;
    return count;
  }

  get looping(): boolean {
    return this.#raf !== 0;
  }

  /**
   * A chain picture exists: its nodes (by their `data-meter` attributes) are listened to while it is on
   * screen. Returns what to call when it goes or changes.
   */
  register(root: HTMLElement, scopeId: string): () => void {
    const pane: Pane = { root, scopeId, visible: false, entries: [] };
    this.#collect(pane);
    return this.#add(pane);
  }

  /**
   * One meter outside the chain pictures: `element` is given `--level` (0 to 1, the peak from -48 dB
   * to full scale) for the audio node `resolve` gives, while the element is on screen. The node is
   * asked for again each frame, so one that is rebuilt is followed. Returns what to call when it goes.
   */
  registerOutput(
    element: HTMLElement,
    key: string,
    resolve: () => AudioNode | null,
  ): () => void {
    const entry: Entry = {
      key: `output:${key}`,
      scopeId: '',
      nodeId: '',
      node: undefined,
      control: false,
      resolve,
      elements: [element],
      shown: -1,
      live: false,
    };
    return this.#add({
      root: element,
      scopeId: '',
      visible: false,
      entries: [entry],
    });
  }

  #add(pane: Pane): () => void {
    const root = pane.root;
    this.#panes.set(root, pane);
    if (typeof IntersectionObserver === 'undefined') {
      pane.visible = true;
    } else {
      this.#observer ??= new IntersectionObserver((records) => {
        for (const record of records) {
          const seen = this.#panes.get(record.target as HTMLElement);
          if (seen) seen.visible = record.isIntersecting;
        }
        this.poke();
      });
      this.#observer.observe(root);
    }
    this.poke();
    return () => {
      this.#observer?.unobserve(root);
      this.#panes.delete(root);
      for (const entry of pane.entries) this.#meters.delete(entry.key);
      this.poke();
    };
  }

  #collect(pane: Pane): void {
    const byKey = new Map<string, Entry>();
    for (const li of pane.root.querySelectorAll<HTMLElement>('[data-meter]')) {
      const nodeId = li.dataset['meter']!;
      const key = `${pane.scopeId}/${nodeId}`;
      let entry = byKey.get(key);
      if (!entry) {
        entry = {
          key,
          scopeId: pane.scopeId,
          nodeId,
          node: undefined,
          control: li.dataset['control'] === 'true',
          elements: [],
          shown: -1,
          live: false,
        };
        byKey.set(key, entry);
      }
      entry.elements.push(li);
    }
    for (const li of pane.root.querySelectorAll<HTMLElement>(
      '[data-meter-in]',
    )) {
      const key = `${pane.scopeId}/${li.dataset['meterIn']}`;
      byKey.get(key)?.elements.push(li);
    }
    pane.entries = [...byKey.values()];
  }

  /** Something that may start or stop the work changed: look again, and start the loop if it is wanted. */
  poke(): void {
    this.#quiet = 0;
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
    const began = performance.now();
    const active = this.step(dt);
    const took = performance.now() - began;
    this.stats.frames++;
    this.stats.total += took;
    if (took > this.stats.worst) this.stats.worst = took;
    // nothing playing and every meter at rest for a moment: stop until something pokes
    this.#quiet = active ? 0 : this.#quiet + dt;
    if (this.#quiet > 1) {
      this.release();
      return;
    }
    this.#raf = requestAnimationFrame(this.#tick);
  };

  /** Stops listening: no taps, levels shown as none. The loop starts again at the next `poke`. */
  release(): void {
    cancelAnimationFrame(this.#raf);
    this.#raf = 0;
    this.#taps?.clear();
    this.#meters.clear();
    for (const pane of this.#panes.values()) {
      for (const entry of pane.entries) this.#show(entry, 0);
    }
  }

  /**
   * One frame: taps for what is on screen, readings, levels written. Returns whether anything is
   * still moving. Called by the loop; tests call it directly.
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
    for (const pane of this.#panes.values()) {
      if (!pane.visible) continue;
      for (const entry of pane.entries) {
        if (entry.resolve) {
          const output = entry.resolve();
          if (output) wanted.set(entry.key, output);
          continue;
        }
        let node = entry.node;
        if (!node || node.disposed) {
          node = this.audio.nodeById(entry.scopeId, entry.nodeId);
          entry.node = node;
        }
        const output = node && !node.disposed ? node.output : null;
        if (output) wanted.set(entry.key, output);
      }
    }
    if (wanted.size > 0 && !this.#taps) this.#taps = new TapSet(engine.context);
    this.#taps?.sync(wanted, dt);
    let active = this.audio.playing;
    for (const pane of this.#panes.values()) {
      for (const entry of pane.entries) {
        let meter = this.#meters.get(entry.key);
        const samples = wanted.has(entry.key)
          ? (this.#taps?.read(entry.key) ?? null)
          : null;
        if (!meter) {
          if (!samples) continue;
          meter = entry.control ? new RangeMeter() : new LevelMeter();
          this.#meters.set(entry.key, meter);
        }
        let level: number;
        if (meter instanceof LevelMeter) {
          if (samples) meter.update(measure(samples, this.#block), dt);
          else meter.idle(dt);
          level = Math.max(
            0,
            Math.min(1, (meter.peakDb - FLOOR_DB) / -FLOOR_DB),
          );
          if (!meter.silent) active = true;
        } else {
          if (samples) meter.update(measure(samples, this.#block), dt);
          level = meter.activity;
          if (samples && level > 0.02) active = true;
        }
        this.#show(entry, level);
      }
    }
    return active;
  }

  #show(entry: Entry, level: number): void {
    const step = Math.round(level * STEPS);
    if (step === entry.shown) return;
    entry.shown = step;
    const value = String(step / STEPS);
    const live = level > FLOW_AT && !this.reducedMotion;
    for (const element of entry.elements) {
      element.style.setProperty('--level', value);
      if (live !== entry.live)
        element.dataset['live'] = live ? 'true' : 'false';
    }
    entry.live = live;
  }
}

declare module '@ember/service' {
  interface Registry {
    'chain-meters': ChainMetersService;
  }
}
