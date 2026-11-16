import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import { modifier } from 'ember-modifier';
import {
  addSlice,
  createWaveformCache,
  moveSlice,
  removeSlice,
  sliceAt,
  sliceByOnsets,
  sliceByTempo,
  sliceGrid,
  type WaveformCache,
} from 'cracked-up/util';
import type { Node } from 'cracked-up';
import Icon from 'client-v2/components/icon';
import NumberEntry from 'client-v2/components/ui/number-entry';
import Slider from 'client-v2/components/ui/slider';
import Toggle from 'client-v2/components/ui/toggle';
import type { ControlView, WaveformView } from 'client-v2/audio/runner';
import { ControlGesture, positionForKey } from 'client-v2/controls/gesture';
import {
  mapping,
  MODE_LABELS,
  type Mapping,
  type ModeName,
} from 'client-v2/controls/modes';
import { mappingOf, numberOf } from 'client-v2/controls/view';
import cssVars from 'client-v2/modifiers/css-vars';
import { MAX_FILE_TEXT } from 'client-v2/project/pool';
import type AudioService from 'client-v2/services/audio';
import type { PoolEntry } from 'client-v2/services/audio';
import type ProjectService from 'client-v2/services/project';
import type ViewService from 'client-v2/services/view';
import { paint, readPalette, type Palette } from 'client-v2/waveform/draw';
import {
  fitView,
  HANDLE_PLACE,
  HANDLES,
  hitHandle,
  hitMarker,
  nearestZeroCrossing,
  panBy,
  pinchView,
  rulerTicks,
  snapTo,
  tabBox,
  timeToX,
  viewOf,
  wholeView,
  xToTime,
  zoomAround,
  zoomOf,
  type HandleId,
  type RulerUnit,
  type Snap,
  type Stage,
  type Tab,
  type View,
} from 'client-v2/waveform/geometry';

const HANDLE_NAMES: Readonly<Record<HandleId, string>> = {
  start: 'Start',
  end: 'End',
  loopStart: 'Loop start',
  loopEnd: 'Loop end',
};

const HANDLE_MARKS: Readonly<Record<HandleId, string>> = {
  start: 'S',
  end: 'E',
  loopStart: 'L',
  loopEnd: 'L',
};

const SNAPS: readonly { value: Snap; label: string }[] = [
  { value: 'off', label: 'No snap' },
  { value: 'slices', label: 'Snap to slices' },
  { value: 'zero', label: 'Snap to zero crossings' },
];

const TEMPO_STEPS = ['1/4', '1/8', '1/16', '1/32'] as const;

type SliceMethod = 'equal' | 'tempo' | 'onsets';

const SLICE_METHODS: readonly { id: SliceMethod; label: string }[] = [
  { id: 'equal', label: 'Equal parts' },
  { id: 'tempo', label: 'Tempo' },
  { id: 'onsets', label: 'Onsets' },
];

/** Sensitivity of the onset detector: a slider from 0 to 1. */
const SENSITIVITY = mapping('linear', { min: 0, max: 1 });

let panels = 0;

const DOUBLE_TAP_MS = 350;
const SLOP_PX = 8;
/** The most slice boundaries given an element each (for the keyboard); the canvas draws them all. */
const MARKER_ELEMENTS = 64;
/** How many play cursors can show at once. */
const CURSORS = 8;
const SLOTS = Array.from({ length: CURSORS }, (_, index) => index);

function seconds(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return value >= 10
    ? `${value.toFixed(1)} s`
    : `${Number(value.toFixed(2))} s`;
}

function poolLabel(entry: PoolEntry): string {
  const state =
    entry.state === 'error'
      ? 'did not load'
      : entry.state === 'loading'
        ? 'loading'
        : seconds(entry.duration);
  return `${entry.name} · ${state}${entry.slices > 1 ? ` · ${entry.slices} slices` : ''}`;
}

function eq(a: unknown, b: unknown): boolean {
  return a === b;
}

interface HandleView {
  id: HandleId;
  name: string;
  mark: string;
  control: ControlView;
  map: Mapping;
  value: number;
  min: number;
  max: number;
  text: string;
  /** px from the left of the stage; and whether it is in view at all */
  x: number;
  shown: boolean;
  tabLeft: number;
  tabTop: number;
  lane: 'top' | 'bottom';
  side: 1 | -1;
}

interface MarkerView {
  index: number;
  time: number;
  x: number;
  label: string;
}

export interface WaveformEditorSignature {
  Element: HTMLElement;
  Args: {
    /** the scope (a track's id) whose script declared it */
    scopeId: string;
    waveform: WaveformView;
    /** every waveform the script declares, this one among them, when there are several to choose from */
    others?: readonly { key: string; label: string }[];
    onChoose?: (key: string) => void;
  };
}

/**
 * The `waveform` widget: a sampler's sound, drawn, with what the sampler plays of it.
 *
 * It keeps nothing of its own but how it is being looked at (zoom, scroll, snap, which boundary is
 * selected). The start, end, loop points, loop, reverse and speed are ordinary declared controls (the
 * ones a `slider` for each parameter would be: same keys, same stored values, same units, same undo),
 * handed to it by the runner; the slices are the sound's, kept with the sound in the project's pool;
 * the sound itself is the sampler's `buffer`, chosen here and stored like a control's value.
 *
 * The picture is a canvas (waveform/draw.ts). The handles, slice flags and play cursors are elements
 * over it: handles and flags so that each is a slider for the keyboard and for assistive tech, cursors
 * so that the playhead moves without the sound being drawn again. One pointer listener on the stage
 * decides what a press is on (waveform/geometry.ts), and drags go through the shared gesture layer
 * (controls/gesture.ts), so a drag that leaves the editor, or is let go anywhere, behaves as every
 * other control's does.
 */
export default class WaveformEditor extends Component<WaveformEditorSignature> {
  @service declare audio: AudioService;
  @service declare project: ProjectService;
  @service declare view: ViewService;

  // --- how it is being looked at ---------------------------------------------------------------------

  @tracked viewStart = 0;
  @tracked viewEnd = 0;
  @tracked width = 0;
  @tracked height = 0;
  @tracked coarse = window.matchMedia('(pointer: coarse)').matches;
  @tracked expanded = false;
  @tracked snap: Snap = 'off';
  @tracked selected = -1;
  @tracked panel = false;
  @tracked method: SliceMethod = 'equal';
  @tracked gridCount = 16;
  @tracked tempoStep: (typeof TEMPO_STEPS)[number] = '1/16';
  @tracked sensitivity = 0.5;
  @tracked preview: number[] | null = null;
  @tracked notice: string | null = null;
  @tracked dropping = false;
  @tracked active: HandleId | null = null;

  #stage: HTMLElement | null = null;
  #canvas: HTMLCanvasElement | null = null;
  #palette: Palette | null = null;
  #cache: WaveformCache | null = null;
  #cacheOf: AudioBuffer | null = null;
  #viewOf: string | null = null;
  #frame = 0;
  #cursorFrame = 0;
  #visible = true;
  #heads: number[] = [];
  #cursors: HTMLElement[] = [];
  #keepCursorsUntil = 0;
  #group = 0;
  #dragGroup: string | undefined;
  #dragMarker = -1;
  /** how far from its point (px) a handle or flag was taken: it keeps that distance from the pointer */
  #grab = 0;
  #lastTime: number | null = null;
  #lastTap = { at: 0, x: 0 };
  #pointers = new Map<number, { x: number; y: number }>();
  #pinch: { view: View; x1: number; x2: number; ids: [number, number] } | null =
    null;
  #background: AbortController | null = null;

  willDestroy(): void {
    super.willDestroy();
    cancelAnimationFrame(this.#frame);
    cancelAnimationFrame(this.#cursorFrame);
    this.#background?.abort();
    this.handleGesture.release();
    this.markerGesture.release();
  }

  // --- what it is a view over ------------------------------------------------------------------------

  get node(): Node | undefined {
    return this.audio.sampler(this.args.scopeId, this.args.waveform.nodeId);
  }

  get sound(): WaveformView['sound'] {
    return this.args.waveform.sound;
  }

  get duration(): number {
    return this.sound?.duration ?? 0;
  }

  get slices(): readonly number[] {
    return this.sound?.slices ?? [];
  }

  get ready(): boolean {
    return this.sound?.state === 'ready' && this.duration > 0;
  }

  get emptyText(): string | null {
    const sound = this.sound;
    if (!sound) return 'This sampler has no sound yet.';
    if (sound.state === 'error') {
      return `“${sound.key}” could not be loaded.`;
    }
    if (sound.state === 'loading') return `Loading “${sound.key}”…`;
    return null;
  }

  control = (name: string): ControlView | undefined =>
    this.args.waveform.params[name];

  /** Where the four points are, in seconds: as the sampler plays them. */
  get times(): Partial<Record<HandleId, number>> {
    const times: Partial<Record<HandleId, number>> = {};
    for (const id of HANDLES) {
      const control = this.control(id);
      if (control && typeof control.value === 'number') {
        times[id] = control.value;
      }
    }
    return times;
  }

  get looping(): boolean {
    return this.control('loop')?.value === true;
  }

  // --- the view --------------------------------------------------------------------------------------

  get current(): View {
    // (until the sound is known, and whenever it is another sound, the view is all of it)
    if (this.viewEnd <= this.viewStart) return wholeView(this.duration);
    return fitView({ start: this.viewStart, end: this.viewEnd }, this.duration);
  }

  get #soundKey(): string {
    return `${this.sound?.key ?? ''}/${this.duration}`;
  }

  setView(view: View): void {
    this.#viewOf = this.#soundKey;
    const fitted = fitView(view, this.duration);
    this.viewStart = fitted.start;
    this.viewEnd = fitted.end;
  }

  get zoomed(): boolean {
    return this.ready && zoomOf(this.current, this.duration) > 1.001;
  }

  get rulerHeight(): number {
    return this.coarse ? 30 : 20;
  }

  get tab(): Tab {
    return this.coarse ? { width: 44, height: 44 } : { width: 22, height: 22 };
  }

  get stage(): Stage {
    return {
      width: this.width,
      top: this.rulerHeight,
      bottom: this.height,
    };
  }

  /** The unit the four points are shown in: the start control's, and they are kept together. */
  get unit(): ModeName {
    return this.control('start')?.mode ?? 'seconds';
  }

  get units(): { value: ModeName; label: string }[] {
    return (this.control('start')?.modes ?? []).map((value) => ({
      value,
      label: MODE_LABELS[value],
    }));
  }

  get rulerUnit(): RulerUnit {
    const unit = this.unit;
    return unit === 'ms' || unit === 'steps' || unit === 'percent'
      ? unit
      : 'seconds';
  }

  get handles(): HandleView[] {
    const view = this.current;
    const stage = this.stage;
    const tab = this.tab;
    const handles: HandleView[] = [];
    for (const id of HANDLES) {
      const control = this.control(id);
      const map = control ? mappingOf(control) : null;
      if (!control || !map || typeof control.value !== 'number') continue;
      // the loop's handles are there to be moved only while the loop is on
      if ((id === 'loopStart' || id === 'loopEnd') && !this.looping) continue;
      const x = timeToX(view, stage.width, control.value);
      const box = tabBox(id, x, stage, tab);
      handles.push({
        id,
        name: HANDLE_NAMES[id],
        mark: HANDLE_MARKS[id],
        control,
        map,
        value: control.value,
        text: map.format(control.value),
        min: map.toValue(0),
        max: map.toValue(1),
        x,
        shown: this.ready && x >= -1 && x <= stage.width + 1,
        tabLeft: box.left,
        tabTop: box.top,
        ...HANDLE_PLACE[id],
      });
    }
    return handles;
  }

  /** The readouts under the picture: all four points, whether or not their handles are in view. */
  get readouts(): {
    id: HandleId;
    name: string;
    text: string;
    faint: boolean;
  }[] {
    return HANDLES.flatMap((id) => {
      const control = this.control(id);
      const map = control ? mappingOf(control) : null;
      if (!control || !map) return [];
      // (the loop's points are shown, like their handles, while the loop is on)
      if ((id === 'loopStart' || id === 'loopEnd') && !this.looping) return [];
      return [
        {
          id,
          name: HANDLE_NAMES[id],
          text: map.format(numberOf(control.value)),
          faint: false,
        },
      ];
    });
  }

  get markers(): MarkerView[] {
    if (!this.ready || this.preview) return [];
    const view = this.current;
    const markers: MarkerView[] = [];
    const slices = this.slices;
    for (let index = 1; index < slices.length - 1; index++) {
      const time = slices[index]!;
      if (time < view.start || time > view.end) continue;
      markers.push({
        index,
        time,
        x: timeToX(view, this.width, time),
        label: `Slice boundary ${index} of ${slices.length - 2}, at ${seconds(time)}`,
      });
      if (markers.length >= MARKER_ELEMENTS) break;
    }
    return markers;
  }

  /** (one panel per editor: ids must not collide when a page has several) */
  panelId = `slices-${++panels}`;

  get methodLabel(): string {
    return SLICE_METHODS.find((entry) => entry.id === this.method)?.label ?? '';
  }

  /** The one line on regions and slices: for a sound that has slices, while the slice panel is not in its place. */
  get showHint(): boolean {
    return this.hasSlices && !this.panel;
  }

  get hasSlices(): boolean {
    return this.ready && this.slices.length > 2;
  }

  get sliceCount(): number {
    return Math.max(1, this.slices.length - 1);
  }

  get miniLeft(): number {
    return this.duration > 0 ? (this.current.start / this.duration) * 100 : 0;
  }

  get miniWidth(): number {
    return this.duration > 0
      ? ((this.current.end - this.current.start) / this.duration) * 100
      : 100;
  }

  // --- drawing ---------------------------------------------------------------------------------------

  /** Everything the picture depends on: when it changes, the canvas is drawn again. */
  get pictureKey(): string {
    const times = this.times;
    return [
      this.viewStart,
      this.viewEnd,
      this.width,
      this.height,
      this.sound?.key,
      this.sound?.state,
      this.duration,
      times.start,
      times.end,
      times.loopStart,
      times.loopEnd,
      this.looping,
      this.slices.join(','),
      this.preview?.join(','),
      this.selected,
      this.unit,
      this.control('start')?.meta.kind === 'number'
        ? (this.control('start')!.meta as { stepSeconds?: number }).stepSeconds
        : 0,
    ].join('|');
  }

  redraw = modifier<{ Args: { Positional: [key: string] } }>((...args) => {
    void args[1][0]; // (read, so that a new key runs this again)
    this.#schedule();
  });

  #schedule(): void {
    cancelAnimationFrame(this.#frame);
    this.#frame = requestAnimationFrame(() => this.#draw());
  }

  #draw(): void {
    const canvas = this.#canvas;
    if (!canvas || this.width <= 0 || this.height <= 0) return;
    const ratio = Math.min(3, window.devicePixelRatio || 1);
    const pixelWidth = Math.round(this.width * ratio);
    const pixelHeight = Math.round(this.height * ratio);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.#palette ??= readPalette(canvas);

    // the sound itself: a cache made once per buffer, asked for one value per device pixel
    const buffer = this.node?.buffer?.buffer ?? null;
    if (buffer !== this.#cacheOf) {
      this.#cacheOf = buffer;
      this.#cache = buffer ? createWaveformCache(buffer) : null;
    }
    const soundKey = this.#soundKey;
    if (soundKey !== this.#viewOf) {
      // another sound: look at all of it
      const first = this.#viewOf === null;
      this.#viewOf = soundKey;
      if (!first && (this.viewStart !== 0 || this.viewEnd !== 0)) {
        this.viewStart = 0;
        this.viewEnd = 0;
        return; // (the change redraws)
      }
    }
    const view = this.current;
    const times = this.times;
    const start = times.start ?? 0;
    const end = times.end ?? this.duration;
    const meta = this.control('start')?.meta;
    const stepSeconds = meta?.kind === 'number' ? (meta.stepSeconds ?? 0) : 0;
    const one =
      this.rulerUnit === 'steps'
        ? stepSeconds
        : this.rulerUnit === 'percent'
          ? this.duration / 100
          : 1;
    paint(
      ctx,
      {
        width: this.width,
        height: this.height,
        ruler: this.rulerHeight,
        view,
        peaks:
          this.#cache && this.ready
            ? this.#cache.peaks({
                buckets: Math.max(1, pixelWidth),
                start: view.start,
                end: view.end,
              })
            : null,
        region: { start, end },
        loop: this.looping
          ? { start: times.loopStart ?? start, end: times.loopEnd ?? end }
          : null,
        slices: this.slices,
        selected: this.selected,
        preview: this.preview,
        ticks: this.ready
          ? rulerTicks(
              view,
              this.width,
              one > 0 ? this.rulerUnit : 'seconds',
              one > 0 ? one : 1,
              this.coarse ? 84 : 64,
            )
          : [],
      },
      this.#palette,
    );
  }

  // --- the play cursor -------------------------------------------------------------------------------

  /** Runs while something may be sounding and the editor is on screen; stops itself when neither. */
  #cursorLoop = (): void => {
    this.#cursorFrame = 0;
    const node = this.node;
    const heads = this.#heads;
    heads.length = 0;
    if (node && this.#visible && this.ready) {
      node.playheads(this.audio.heardTime, heads);
    }
    const view = this.current;
    const width = this.width;
    for (let index = 0; index < this.#cursors.length; index++) {
      const element = this.#cursors[index]!;
      const time = heads[index];
      const x = time === undefined ? -1 : timeToX(view, width, time);
      if (x < 0 || x > width) {
        if (element.dataset['on']) delete element.dataset['on'];
      } else {
        element.style.transform = `translateX(${x.toFixed(1)}px)`;
        if (!element.dataset['on']) element.dataset['on'] = 'true';
      }
    }
    const sounding = heads.length > 0;
    if (sounding) this.#keepCursorsUntil = performance.now() + 400;
    if (
      this.#visible &&
      (sounding ||
        this.audio.playing ||
        performance.now() < this.#keepCursorsUntil)
    ) {
      this.#cursorFrame = requestAnimationFrame(this.#cursorLoop);
    }
  };

  #watchCursors(forMs = 1500): void {
    this.#keepCursorsUntil = Math.max(
      this.#keepCursorsUntil,
      performance.now() + forMs,
    );
    if (!this.#cursorFrame) {
      this.#cursorFrame = requestAnimationFrame(this.#cursorLoop);
    }
  }

  /** The transport started (or stopped): look for playheads again. */
  followPlaying = modifier<{ Args: { Positional: [playing: boolean] } }>(
    (...args) => {
      void args[1][0];
      this.#watchCursors();
    },
  );

  registerCursor = modifier((element: HTMLElement) => {
    this.#cursors.push(element);
    return () => {
      this.#cursors = this.#cursors.filter((other) => other !== element);
    };
  });

  // --- the stage: size, wheel, pointers --------------------------------------------------------------

  attach = modifier((element: HTMLElement) => {
    this.#stage = element;
    this.#canvas = element.querySelector('canvas');
    const measure = (): void => {
      const width = element.clientWidth;
      const height = element.clientHeight;
      if (width !== this.width || height !== this.height) {
        this.width = width;
        this.height = height;
      }
      this.#palette = null; // (the theme may differ where it now sits)
    };
    const resize = new ResizeObserver(measure);
    resize.observe(element);
    const seen = new IntersectionObserver(([entry]) => {
      this.#visible = entry?.isIntersecting ?? true;
      if (this.#visible) this.#watchCursors(300);
    });
    seen.observe(element);
    const coarse = window.matchMedia('(pointer: coarse)');
    const onCoarse = (): void => {
      this.coarse = coarse.matches;
    };
    coarse.addEventListener('change', onCoarse);
    // a sound that arrives, or is replaced, under the same name
    const offReady = this.audio.engine?.buffers.on('ready', () =>
      this.#schedule(),
    );
    element.addEventListener('wheel', this.onWheel, { passive: false });
    return () => {
      resize.disconnect();
      seen.disconnect();
      coarse.removeEventListener('change', onCoarse);
      offReady?.();
      element.removeEventListener('wheel', this.onWheel);
      this.#stage = null;
      this.#canvas = null;
    };
  });

  #local(event: { clientX: number; clientY: number }): {
    x: number;
    y: number;
  } {
    // (in the stage's own layout pixels, whatever transform an ancestor has)
    const stage = this.#stage;
    if (!stage) return { x: 0, y: 0 };
    const rect = stage.getBoundingClientRect();
    // (the border box, scaled back to layout pixels, less the border: the box the picture is drawn in)
    return {
      x:
        (event.clientX - rect.left) * (stage.offsetWidth / (rect.width || 1)) -
        stage.clientLeft,
      y:
        (event.clientY - rect.top) * (stage.offsetHeight / (rect.height || 1)) -
        stage.clientTop,
    };
  }

  /**
   * Pinch on a trackpad (which arrives as a wheel with Ctrl) zooms around the pointer; a sideways
   * wheel, or Shift, scrolls. A plain wheel is left to scroll the pane, except in the expanded editor,
   * where there is nothing else to scroll and it zooms.
   */
  onWheel = (event: WheelEvent): void => {
    if (!this.ready) return;
    const view = this.current;
    const { x } = this.#local(event);
    if (event.ctrlKey || event.metaKey || (this.expanded && !event.shiftKey)) {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY) && !event.ctrlKey) {
        event.preventDefault();
        this.setView(
          panBy(
            view,
            this.duration,
            (event.deltaX / (this.width || 1)) * (view.end - view.start),
          ),
        );
        return;
      }
      event.preventDefault();
      const factor = Math.exp(-event.deltaY * (event.ctrlKey ? 0.012 : 0.0035));
      this.setView(
        zoomAround(view, this.duration, factor, xToTime(view, this.width, x)),
      );
      return;
    }
    const sideways = event.shiftKey
      ? event.deltaY || event.deltaX
      : event.deltaX;
    if (
      sideways !== 0 &&
      (event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) &&
      this.zoomed
    ) {
      event.preventDefault();
      this.setView(
        panBy(
          view,
          this.duration,
          (sideways / (this.width || 1)) * (view.end - view.start),
        ),
      );
    }
  };

  /**
   * A press on the stage gives focus to the handle or flag it is on (see below), and must not then take
   * it away again as a press on something that cannot have focus would; nor start selecting text.
   */
  keepFocus = (event: MouseEvent): void => event.preventDefault();

  /** One listener decides what a press is on: a slice flag, a handle, or the sound itself. */
  onPointerDown = (event: PointerEvent): void => {
    if (!this.ready) return;
    const at = this.#local(event);
    if (event.pointerType === 'touch') {
      this.#pointers.set(event.pointerId, at);
      if (this.#pointers.size === 2) {
        this.#beginPinch();
        return;
      }
      if (this.#pointers.size > 2) return;
    }
    if (event.button !== 0) return;
    const view = this.current;
    this.#lastTime = xToTime(view, this.width, at.x);

    if (at.y <= this.rulerHeight && !this.preview) {
      const marker = hitMarker(
        this.slices,
        view,
        this.width,
        at.x,
        this.coarse ? 22 : 7,
      );
      if (marker >= 0) {
        this.selected = marker;
        this.#dragMarker = marker;
        this.#grab = at.x - timeToX(view, this.width, this.slices[marker] ?? 0);
        this.#stage
          ?.querySelector<HTMLElement>(`[data-test-slice-marker="${marker}"]`)
          ?.focus({ preventScroll: true });
        this.#dragGroup = `slice-${++this.#group}`;
        this.markerGesture.down(event);
        return;
      }
    }
    const handle = hitHandle(
      this.times,
      view,
      this.stage,
      this.tab,
      at.x,
      at.y,
    );
    if (handle && this.handles.some((candidate) => candidate.id === handle)) {
      this.active = handle;
      this.#grab = at.x - timeToX(view, this.width, this.times[handle] ?? 0);
      this.#dragGroup = `handle-${++this.#group}`;
      this.#stage
        ?.querySelector<HTMLElement>(`[data-handle="${handle}"]`)
        ?.focus({ preventScroll: true });
      this.handleGesture.down(event);
      return;
    }
    this.#beginBackground(event, at);
  };

  /** Dragging a handle: it follows the pointer's movement, snapped and kept on its side of the others. */
  handleGesture = new ControlGesture({
    position: () => {
      const view = this.current;
      const time = this.active ? (this.times[this.active] ?? 0) : 0;
      return (time - view.start) / (view.end - view.start);
    },
    axis: () => 'x',
    // it keeps its place under the pointer, wherever the pointer goes and comes back from
    positionAt: (event) =>
      (this.#local(event).x - this.#grab) / (this.width || 1),
    travel: (event, from, element) =>
      (event.clientX - from.clientX) /
      (element.getBoundingClientRect().width || 1),
    onPosition: (position) => {
      const view = this.current;
      if (this.active) {
        this.moveHandle(
          this.active,
          view.start + position * (view.end - view.start),
          this.#dragGroup,
        );
      }
    },
    // (double click, double tap: back to what the script says)
    onReset: () => {
      const control = this.active ? this.control(this.active) : undefined;
      if (control) this.audio.resetControl(this.args.scopeId, control.key);
    },
  });

  /** Dragging a slice boundary: it stays between its neighbours. */
  markerGesture = new ControlGesture({
    position: () => {
      const view = this.current;
      const time = this.slices[this.#dragMarker] ?? 0;
      return (time - view.start) / (view.end - view.start);
    },
    axis: () => 'x',
    // it keeps its place under the pointer, wherever the pointer goes and comes back from
    positionAt: (event) =>
      (this.#local(event).x - this.#grab) / (this.width || 1),
    travel: (event, from, element) =>
      (event.clientX - from.clientX) /
      (element.getBoundingClientRect().width || 1),
    onPosition: (position) => {
      const view = this.current;
      this.moveMarker(
        this.#dragMarker,
        view.start + position * (view.end - view.start),
        this.#dragGroup,
      );
    },
    onReset: () => this.removeMarker(this.#dragMarker),
  });

  /** How far a point may be from something and still snap to it: a few pixels, as seconds. */
  get reach(): number {
    const view = this.current;
    return (
      ((view.end - view.start) / (this.width || 1)) * (this.coarse ? 14 : 8)
    );
  }

  #snapped(time: number, slicesToo: boolean): number {
    if (this.snap === 'slices' && slicesToo) {
      return snapTo(time, this.slices, this.reach);
    }
    if (this.snap === 'zero') {
      const buffer = this.node?.buffer?.buffer;
      if (buffer) {
        return nearestZeroCrossing(
          buffer.getChannelData(0),
          buffer.sampleRate,
          time,
          Math.max(this.reach, 0.002),
        );
      }
    }
    return time;
  }

  moveHandle(id: HandleId, time: number, group?: string): void {
    const control = this.control(id);
    if (!control || control.meta.kind !== 'number') return;
    const meta = control.meta;
    const low = Math.max(meta.min, meta.floor ?? meta.min);
    const high = Math.max(low, Math.min(meta.max, meta.ceiling ?? meta.max));
    const value = Math.min(high, Math.max(low, this.#snapped(time, true)));
    if (value === control.value) return;
    if (id === 'loopStart') {
      // A loop end at or before the loop start means "the whole region" to the sampler, so a loop
      // start alone would do nothing: the loop end is written down where it stands, with it.
      const end = this.control('loopEnd');
      const raw = Number(this.node?.param('loopEnd').value) || 0;
      if (end && typeof end.value === 'number' && !(raw > value)) {
        this.audio.setControl(this.args.scopeId, end.key, end.value, group);
      }
    }
    this.audio.setControl(this.args.scopeId, control.key, value, group);
  }

  moveMarker(index: number, time: number, group?: string): void {
    const sound = this.sound;
    if (!sound || index < 1 || index >= this.slices.length - 1) return;
    const next = moveSlice(
      this.slices,
      index,
      this.#snapped(time, false),
      this.duration,
    );
    this.audio.setSlices(sound.key, next, group);
  }

  removeMarker = (index: number): void => {
    const sound = this.sound;
    if (!sound || index < 1 || index >= this.slices.length - 1) return;
    this.audio.setSlices(
      sound.key,
      removeSlice(this.slices, index, this.duration),
    );
    this.selected = -1;
  };

  removeSelected = (): void => this.removeMarker(this.selected);

  addMarkerAt(time: number): void {
    const sound = this.sound;
    if (!sound || !this.ready) return;
    const at = this.#snapped(time, false);
    const base = this.slices.length >= 2 ? this.slices : [0, this.duration];
    const next = addSlice(base, at, this.duration);
    this.audio.setSlices(sound.key, next);
    this.selected = next.indexOf(at);
  }

  /** The button: at the place last pressed if it is in view, else the middle of what is in view. */
  addMarker = (): void => {
    const view = this.current;
    const time =
      this.#lastTime !== null &&
      this.#lastTime > view.start &&
      this.#lastTime < view.end
        ? this.#lastTime
        : (view.start + view.end) / 2;
    this.addMarkerAt(time);
  };

  // --- the sound itself: tap to hear, drag to scroll, two fingers to zoom ----------------------------

  #beginBackground(event: PointerEvent, at: { x: number; y: number }): void {
    this.#background?.abort();
    const abort = new AbortController();
    this.#background = abort;
    const { signal } = abort;
    const start = { x: event.clientX, y: event.clientY, view: this.current };
    const id = event.pointerId;
    const touch = event.pointerType !== 'mouse';
    let moved = false;
    const stage = this.#stage;
    try {
      stage?.setPointerCapture(id);
    } catch {
      // (a synthetic pointer)
    }
    const end = (): void => {
      abort.abort();
      if (this.#background === abort) this.#background = null;
      try {
        if (stage?.hasPointerCapture(id)) stage.releasePointerCapture(id);
      } catch {
        // (never captured)
      }
    };
    window.addEventListener(
      'pointermove',
      (move) => {
        if (move.pointerId !== id) return;
        if (!touch && move.buttons === 0) return end();
        const dx = move.clientX - start.x;
        const dy = move.clientY - start.y;
        if (!moved) {
          if (Math.hypot(dx, dy) <= (touch ? SLOP_PX : 3)) return;
          if (touch && Math.abs(dy) > Math.abs(dx)) return end(); // a scroll of the pane
          moved = true;
        }
        const span = start.view.end - start.view.start;
        this.setView(
          panBy(start.view, this.duration, (-dx / (this.width || 1)) * span),
        );
      },
      { signal },
    );
    window.addEventListener(
      'pointerup',
      (up) => {
        if (up.pointerId !== id) return;
        end();
        if (moved) return;
        const again =
          up.timeStamp - this.#lastTap.at < DOUBLE_TAP_MS &&
          Math.abs(at.x - this.#lastTap.x) < 24;
        this.#lastTap = again ? { at: 0, x: 0 } : { at: up.timeStamp, x: at.x };
        const time = xToTime(start.view, this.width, at.x);
        if (again) this.addMarkerAt(time);
        else if (at.y > this.rulerHeight) void this.hear(time);
      },
      { signal },
    );
    window.addEventListener(
      'pointercancel',
      (cancel) => {
        if (cancel.pointerId === id) end();
      },
      { signal },
    );
    window.addEventListener('blur', end, { signal });
  }

  #beginPinch(): void {
    this.handleGesture.release();
    this.markerGesture.release();
    this.#background?.abort();
    this.#background = null;
    const [a, b] = [...this.#pointers.entries()];
    if (!a || !b) return;
    this.#pinch = {
      view: this.current,
      x1: a[1].x,
      x2: b[1].x,
      ids: [a[0], b[0]],
    };
  }

  onPointerMove = (event: PointerEvent): void => {
    if (!this.#pointers.has(event.pointerId)) return;
    this.#pointers.set(event.pointerId, this.#local(event));
    const pinch = this.#pinch;
    if (!pinch) return;
    const first = this.#pointers.get(pinch.ids[0]);
    const second = this.#pointers.get(pinch.ids[1]);
    if (!first || !second) return;
    this.setView(
      pinchView(
        pinch,
        { x1: first.x, x2: second.x },
        this.width,
        this.duration,
      ),
    );
  };

  onPointerEnd = (event: PointerEvent): void => {
    this.#pointers.delete(event.pointerId);
    if (this.#pinch?.ids.includes(event.pointerId)) this.#pinch = null;
  };

  /** Plays the slice a moment is in (or the whole region, for a sound that is one slice). */
  async hear(time: number): Promise<void> {
    const slice = this.slices.length > 2 ? sliceAt(this.slices, time) : -1;
    const heard = await this.audio.audition(
      this.args.scopeId,
      this.args.waveform.nodeId,
      slice >= 0 ? slice : undefined,
    );
    if (heard) {
      this.notice = null;
      this.#watchCursors(4000);
    } else {
      this.notice =
        'Nothing could be played: the browser has not let audio start yet. Press Play once, then try again.';
    }
  }

  // --- the keyboard ----------------------------------------------------------------------------------

  onHandleKey = (handle: HandleView, event: KeyboardEvent): void => {
    const next = positionForKey(
      event,
      handle.map.toPosition(handle.value),
      handle.map,
    );
    if (next === null) return;
    event.preventDefault();
    this.moveHandle(handle.id, handle.map.toValue(next));
  };

  onMarkerKey = (marker: MarkerView, event: KeyboardEvent): void => {
    const view = this.current;
    const pixel = (view.end - view.start) / (this.width || 1);
    const by = event.shiftKey ? pixel : pixel * 8;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.moveMarker(marker.index, marker.time - by);
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveMarker(marker.index, marker.time + by);
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      this.removeMarker(marker.index);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      void this.hear(marker.time + pixel);
    }
  };

  selectMarker = (marker: MarkerView): void => {
    this.selected = marker.index;
  };

  focusHandle = (handle: HandleView): void => {
    this.active = handle.id;
  };

  onKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.expanded) {
      event.stopPropagation();
      this.expanded = false;
    }
  };

  // --- the toolbar -----------------------------------------------------------------------------------

  zoomIn = (): void => this.#zoomBy(2);
  zoomOut = (): void => this.#zoomBy(0.5);

  #zoomBy(factor: number): void {
    const view = this.current;
    this.setView(
      zoomAround(view, this.duration, factor, (view.start + view.end) / 2),
    );
  }

  zoomAll = (): void => this.setView(wholeView(this.duration));

  zoomRegion = (): void => {
    const times = this.times;
    this.setView(
      viewOf(times.start ?? 0, times.end ?? this.duration, this.duration),
    );
  };

  /** A press on the strip under the picture: look there. */
  onMini = (event: MouseEvent): void => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const view = this.current;
    const span = view.end - view.start;
    const centre =
      ((event.clientX - rect.left) / (rect.width || 1)) * this.duration;
    this.setView({ start: centre - span / 2, end: centre + span / 2 });
  };

  togglePlay = (): void => this.audio.toggle();

  toggleExpanded = (): void => {
    this.expanded = !this.expanded;
  };

  togglePanel = (): void => {
    this.panel = !this.panel;
    if (this.panel) this.#refreshPreview();
    else this.preview = null;
  };

  setSnap = (event: Event): void => {
    this.snap = (event.target as HTMLSelectElement).value as Snap;
  };

  setUnit = (event: Event): void => {
    const mode = (event.target as HTMLSelectElement).value;
    for (const id of HANDLES) {
      const control = this.control(id);
      if (control) {
        this.audio.setControlMode(this.args.scopeId, control.key, mode);
      }
    }
  };

  commit = (id: HandleId, typed: string): boolean => {
    const control = this.control(id);
    const value = control ? mappingOf(control)?.parse(typed) : null;
    if (!control || value === null || value === undefined) return false;
    this.audio.setControl(this.args.scopeId, control.key, value);
    return true;
  };

  setToggle = (name: string, value: boolean): void => {
    const control = this.control(name);
    if (control) this.audio.setControl(this.args.scopeId, control.key, value);
  };

  isOn = (name: string): boolean => this.control(name)?.value === true;

  get speedText(): string {
    const control = this.control('speed');
    return control
      ? (mappingOf(control)?.format(numberOf(control.value)) ?? '')
      : '';
  }

  commitSpeed = (typed: string): boolean => {
    const control = this.control('speed');
    const value = control ? mappingOf(control)?.parse(typed) : null;
    if (!control || value === null || value === undefined) return false;
    this.audio.setControl(this.args.scopeId, control.key, value);
    return true;
  };

  showInScript = (): void => {
    const line = this.args.waveform.line;
    if (line !== undefined) this.view.showInScript(this.args.scopeId, line);
  };

  get linked(): boolean {
    const linked = this.view.linked;
    return (
      linked !== null &&
      linked.scopeId === this.args.scopeId &&
      linked.line === this.args.waveform.line
    );
  }

  // --- slices, made all at once ----------------------------------------------------------------------

  /** The three ways of cutting the sound all at once: one is shown at a time. */
  setMethod = (method: SliceMethod): void => {
    this.method = method;
    this.#refreshPreview();
  };

  isMethod = (method: SliceMethod): boolean => this.method === method;

  /** Arrow keys move along the tabs, as in any tab list. */
  onMethodKey = (event: KeyboardEvent): void => {
    const at = SLICE_METHODS.findIndex((entry) => entry.id === this.method);
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0;
    if (step === 0) return;
    event.preventDefault();
    const next =
      SLICE_METHODS[(at + step + SLICE_METHODS.length) % SLICE_METHODS.length]!;
    this.setMethod(next.id);
    (event.currentTarget as HTMLElement)
      .querySelector<HTMLElement>(`[data-test-slice-tab="${next.id}"]`)
      ?.focus();
  };

  setGridCount = (event: Event): void => {
    const count = Number((event.target as HTMLInputElement).value);
    if (Number.isFinite(count)) {
      this.gridCount = Math.min(256, Math.max(1, Math.round(count)));
      this.#refreshPreview();
    }
  };

  setTempoStep = (event: Event): void => {
    this.tempoStep = (event.target as HTMLSelectElement)
      .value as (typeof TEMPO_STEPS)[number];
    this.#refreshPreview();
  };

  /** Moving the sensitivity shows where the boundaries would be; nothing changes until Apply. */
  setSensitivity = (value: number): void => {
    this.sensitivity = value;
    this.#refreshPreview();
  };

  /**
   * Where the boundaries would be with the settings of the tab that is showing: drawn over the sound in
   * place of the real ones while the panel is open. Nothing is changed until Apply.
   */
  #refreshPreview(): void {
    if (!this.ready) {
      this.preview = null;
      return;
    }
    if (this.method === 'equal') {
      this.preview = sliceGrid(this.duration, this.gridCount);
    } else if (this.method === 'tempo') {
      this.preview = sliceByTempo(
        this.duration,
        this.project.doc.bpm,
        this.tempoStep,
      );
    } else {
      const buffer = this.node?.buffer?.buffer;
      this.preview = buffer
        ? sliceByOnsets(buffer, { sensitivity: this.sensitivity })
        : null;
    }
  }

  get previewCount(): number {
    return this.preview ? Math.max(1, this.preview.length - 1) : 0;
  }

  /** Makes the boundaries shown the sound's slices, and closes the panel. */
  applySlices = (): void => {
    const sound = this.sound;
    if (!sound || !this.preview) return;
    this.audio.setSlices(sound.key, this.preview);
    this.selected = -1;
    this.panel = false;
    this.preview = null;
  };

  clearSlices = (): void => {
    const sound = this.sound;
    if (!sound) return;
    this.audio.setSlices(sound.key, []);
    this.selected = -1;
    this.panel = false;
    this.preview = null;
  };

  get several(): boolean {
    return (this.args.others?.length ?? 0) > 1;
  }

  chooseOther = (event: Event): void =>
    this.args.onChoose?.((event.target as HTMLSelectElement).value);

  // --- which sound -----------------------------------------------------------------------------------

  get pool(): PoolEntry[] {
    return this.audio.pool();
  }

  chooseSound = (event: Event): void => {
    const name = (event.target as HTMLSelectElement).value;
    if (name && name !== this.sound?.key) {
      this.audio.setControl(
        this.args.scopeId,
        this.args.waveform.soundKey,
        name,
      );
    }
  };

  resetSound = (): void =>
    this.audio.resetControl(this.args.scopeId, this.args.waveform.soundKey);

  pickFile = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) void this.addFile(file);
  };

  async addFile(file: File): Promise<void> {
    this.notice = `Adding “${file.name}”…`;
    const result = await this.audio.addFile(file);
    if ('name' in result) {
      this.notice =
        'error' in result && typeof result.error === 'string'
          ? result.error
          : null;
      if (this.args.waveform.choosable) {
        this.audio.setControl(
          this.args.scopeId,
          this.args.waveform.soundKey,
          result.name,
        );
      } else {
        this.notice = `Added as '${result.name}'. Write buffer: '${result.name}' in the script to play it.`;
      }
    } else {
      this.notice = result.error;
    }
  }

  onDragOver = (event: DragEvent): void => {
    if (!event.dataTransfer?.types.includes('Files')) return;
    event.preventDefault();
    this.dropping = true;
  };

  onDragLeave = (): void => {
    this.dropping = false;
  };

  onDrop = (event: DragEvent): void => {
    this.dropping = false;
    const file = event.dataTransfer?.files[0];
    if (!file) return;
    event.preventDefault();
    void this.addFile(file);
  };

  dismissNotice = (): void => {
    this.notice = null;
  };

  <template>
    {{! template-lint-disable no-pointer-down-event-binding no-invalid-interactive }}
    {{! a drag has to begin when the pointer goes down; a file can be dropped anywhere on the editor }}
    <section
      class="waveform
        {{if this.expanded 'waveform--expanded'}}
        {{if this.dropping 'waveform--dropping'}}"
      aria-label="{{@waveform.label}} waveform"
      data-linked={{if this.linked "true"}}
      data-snap={{this.snap}}
      data-panel={{if this.panel "open"}}
      data-zoomed={{if this.zoomed "true"}}
      data-test-waveform={{@waveform.nodeId}}
      ...attributes
      {{on "keydown" this.onKeydown}}
      {{on "dragover" this.onDragOver}}
      {{on "dragleave" this.onDragLeave}}
      {{on "drop" this.onDrop}}
      {{this.redraw this.pictureKey}}
      {{this.followPlaying this.audio.playing}}
    >
      <header class="waveform__head">
        <h4
          class="waveform__title {{if this.several 'waveform__title--several'}}"
        >
          <b>{{@waveform.label}}</b>
          {{#if @waveform.byPosition}}
            <span
              class="control-group__hint"
              title="This sampler has no id in the script, so what is stored for it follows its position in the script."
            >no id</span>
          {{/if}}
        </h4>
        {{#if this.several}}
          {{! where a list of the script's waveforms beside the editor would cost too much width }}
          <label class="waveform__field waveform__switch">
            <span class="sr-only">Waveform</span>
            <select
              class="select waveform__select"
              data-test-waveform-picker
              {{on "change" this.chooseOther}}
            >
              {{#each @others key="key" as |other|}}
                <option
                  value={{other.key}}
                  selected={{eq other.key @waveform.key}}
                >{{other.label}}</option>
              {{/each}}
            </select>
          </label>
        {{/if}}

        <div class="waveform__sound">
          {{#if @waveform.choosable}}
            <label class="waveform__field">
              <span class="sr-only">Sound</span>
              <select
                class="select waveform__select"
                data-test-sound-select
                {{on "change" this.chooseSound}}
              >
                {{#unless this.sound}}
                  <option value="" selected>no sound</option>
                {{/unless}}
                {{#each this.pool key="name" as |entry|}}
                  <option
                    value={{entry.name}}
                    selected={{eq entry.name this.sound.key}}
                  >{{poolLabel entry}}</option>
                {{/each}}
              </select>
            </label>
            {{#if @waveform.soundStored}}
              <button
                type="button"
                class="btn btn--s btn--on-yellow"
                title="Back to the sound the script names"
                data-test-sound-reset
                {{on "click" this.resetSound}}
              >Reset</button>
            {{/if}}
          {{else}}
            <span class="waveform__name" data-test-sound-name>{{if
                this.sound
                this.sound.key
                "no sound"
              }}
              {{#if this.sound.duration}}·
                {{seconds this.sound.duration}}{{/if}}</span>
          {{/if}}
          <label
            class="btn btn--s btn--on-yellow waveform__file waveform__tool-group--more"
            title="Add an audio file from this device to the project (up to {{MAX_FILE_TEXT}})"
          >
            <span>Add file<span class="sr-only"> from this device</span></span>
            <input
              type="file"
              class="sr-only"
              accept="audio/*,.wav,.mp3,.m4a,.aac,.flac,.ogg,.oga,.aif,.aiff"
              data-test-add-file
              {{on "change" this.pickFile}}
            />
          </label>
        </div>

        <div class="waveform__head-actions">
          {{#if @waveform.line}}
            <button
              type="button"
              class="btn btn--s btn--ghost btn--on-yellow waveform__tool-group--more"
              aria-label="Show this waveform in the script"
              title="Show in script"
              data-test-show-in-script
              {{on "click" this.showInScript}}
            ><Icon @name="code" /></button>
          {{/if}}
          {{#if this.expanded}}
            {{! the expanded editor covers the transport, so it has the one control of it that matters here }}
            <button
              type="button"
              class="btn btn--s btn--on-yellow"
              aria-pressed={{if this.audio.playing "true" "false"}}
              data-test-waveform-play
              {{on "click" this.togglePlay}}
            >{{if this.audio.playing "Stop" "Play"}}</button>
          {{/if}}
          <button
            type="button"
            class="btn btn--s btn--on-yellow"
            aria-pressed={{if this.expanded "true" "false"}}
            data-test-waveform-expand
            {{on "click" this.toggleExpanded}}
          >{{if this.expanded "Done" "Expand"}}</button>
        </div>
      </header>

      <div class="waveform__tools" role="toolbar" aria-label="Waveform tools">
        <div class="waveform__tool-group">
          <button
            type="button"
            class="btn btn--s btn--on-yellow"
            aria-label="Zoom out"
            disabled={{if this.zoomed false true}}
            data-test-zoom-out
            {{on "click" this.zoomOut}}
          >−</button>
          <button
            type="button"
            class="btn btn--s btn--on-yellow"
            aria-label="Zoom in"
            data-test-zoom-in
            {{on "click" this.zoomIn}}
          >+</button>
          <button
            type="button"
            class="btn btn--s btn--on-yellow"
            title="Zoom to what the sampler plays"
            data-test-zoom-region
            {{on "click" this.zoomRegion}}
          >Region</button>
          <button
            type="button"
            class="btn btn--s btn--on-yellow"
            title="Show the whole sound"
            disabled={{if this.zoomed false true}}
            data-test-zoom-all
            {{on "click" this.zoomAll}}
          >All</button>
        </div>
        <div class="waveform__tool-group waveform__tool-group--more">
          <select
            class="select waveform__select"
            aria-label="Snapping"
            data-test-snap
            {{on "change" this.setSnap}}
          >
            {{#each SNAPS as |choice|}}
              <option
                value={{choice.value}}
                selected={{eq choice.value this.snap}}
              >{{choice.label}}</option>
            {{/each}}
          </select>
        </div>
        <div class="waveform__tool-group waveform__tool-group--more">
          <button
            type="button"
            class="btn btn--s btn--on-yellow waveform__disclosure
              {{if this.panel 'is-open'}}"
            aria-expanded={{if this.panel "true" "false"}}
            aria-controls={{this.panelId}}
            title="Cut the sound into slices: in equal parts, by the tempo, or where its hits are"
            data-test-slices-toggle
            {{on "click" this.togglePanel}}
          >
            <span>Slices ({{this.sliceCount}})</span>
            <Icon
              @name="play"
              class="icon--s {{if this.panel 'icon--up' 'icon--down'}}"
            />
          </button>
          <button
            type="button"
            class="btn btn--s btn--on-yellow"
            title="Add a slice boundary where you last pressed (or double-click the sound)"
            data-test-slice-add
            {{on "click" this.addMarker}}
          >Add</button>
          <button
            type="button"
            class="btn btn--s btn--on-yellow"
            title="Remove the selected slice boundary (or select it and press Delete)"
            disabled={{if (eq this.selected -1) true false}}
            data-test-slice-remove
            {{on "click" this.removeSelected}}
          >Remove</button>
        </div>
      </div>

      {{#if this.panel}}
        <div class="waveform__panel" id={{this.panelId}} data-test-slices-panel>
          {{! template-lint-disable no-invalid-interactive }}
          <div
            class="waveform__tabs"
            role="tablist"
            aria-label="How to cut the sound into slices"
            {{on "keydown" this.onMethodKey}}
          >
            {{#each SLICE_METHODS as |entry|}}
              <button
                type="button"
                class="waveform__tab"
                role="tab"
                aria-selected={{if (this.isMethod entry.id) "true" "false"}}
                tabindex={{if (this.isMethod entry.id) "0" "-1"}}
                data-test-slice-tab={{entry.id}}
                {{on "click" (fn this.setMethod entry.id)}}
              >{{entry.label}}</button>
            {{/each}}
          </div>
          <div
            class="waveform__tabpanel"
            role="tabpanel"
            aria-label={{this.methodLabel}}
          >
            {{#if (this.isMethod "equal")}}
              <label class="waveform__field">
                <span>Parts</span>
                <input
                  type="number"
                  class="waveform__number"
                  min="1"
                  max="256"
                  inputmode="numeric"
                  value={{this.gridCount}}
                  data-test-grid-count
                  {{on "input" this.setGridCount}}
                  {{on "change" this.setGridCount}}
                />
              </label>
            {{else if (this.isMethod "tempo")}}
              <label class="waveform__field">
                <span>One slice every</span>
                <select
                  class="select waveform__select"
                  data-test-tempo-step
                  {{on "change" this.setTempoStep}}
                >
                  {{#each TEMPO_STEPS as |step|}}
                    <option
                      value={{step}}
                      selected={{eq step this.tempoStep}}
                    >{{step}}</option>
                  {{/each}}
                </select>
                <span>at {{this.project.doc.bpm}} bpm</span>
              </label>
            {{else}}
              <span class="waveform__field waveform__field--grow">
                <span>Sensitivity</span>
                <Slider
                  @value={{this.sensitivity}}
                  @mapping={{SENSITIVITY}}
                  @label="Onset sensitivity"
                  @onChange={{this.setSensitivity}}
                  data-test-onset-sensitivity
                />
              </span>
            {{/if}}
            <span
              class="waveform__count"
              title="Shown dashed in red over the sound until you apply"
            >
              <b data-test-slices-count>{{this.previewCount}}
                {{if (eq this.previewCount 1) "slice" "slices"}}</b>
              <span data-test-slices-note>of the sound{{#if this.sound}}
                  “{{this.sound.key}}”{{/if}}, for every track that plays it</span>
            </span>
            <button
              type="button"
              class="btn btn--s waveform__apply"
              data-test-slices-apply
              {{on "click" this.applySlices}}
            >Apply</button>
            <button
              type="button"
              class="btn btn--s btn--on-yellow"
              title="Remove every slice boundary: the sound is one slice again"
              data-test-slice-clear
              {{on "click" this.clearSlices}}
            >Clear</button>
          </div>
        </div>
      {{/if}}

      {{#if this.notice}}
        <p class="waveform__notice" role="status" data-test-waveform-notice>
          <span>{{this.notice}}</span>
          <button
            type="button"
            class="btn btn--s btn--ghost btn--on-yellow"
            aria-label="Dismiss"
            {{on "click" this.dismissNotice}}
          >×</button>
        </p>
      {{/if}}

      <div
        class="waveform__stage"
        data-ready={{if this.ready "true"}}
        data-test-waveform-stage
        {{this.attach}}
        {{on "pointerdown" this.onPointerDown}}
        {{on "mousedown" this.keepFocus}}
        {{on "pointermove" this.onPointerMove}}
        {{on "pointerup" this.onPointerEnd}}
        {{on "pointercancel" this.onPointerEnd}}
      >
        <canvas class="waveform__canvas" aria-hidden="true"></canvas>

        {{#if this.emptyText}}
          <p
            class="waveform__empty"
            data-test-waveform-empty
          >{{this.emptyText}}</p>
        {{/if}}

        {{#each this.markers key="index" as |marker|}}
          <button
            type="button"
            class="waveform__marker
              {{if (eq marker.index this.selected) 'is-selected'}}"
            aria-label={{marker.label}}
            aria-pressed={{if (eq marker.index this.selected) "true" "false"}}
            title="Drag to move; Delete removes it"
            data-test-slice-marker={{marker.index}}
            {{cssVars x=marker.x}}
            {{on "focus" (fn this.selectMarker marker)}}
            {{on "keydown" (fn this.onMarkerKey marker)}}
          ></button>
        {{/each}}

        {{#each this.handles key="id" as |handle|}}
          <div
            class="waveform__handle waveform__handle--{{handle.lane}}
              {{if
                (eq handle.side 1)
                'waveform__handle--after'
                'waveform__handle--before'
              }}
              {{if (eq handle.id this.active) 'is-active'}}"
            role="slider"
            tabindex="0"
            hidden={{if handle.shown false true}}
            aria-label={{handle.name}}
            aria-orientation="horizontal"
            aria-valuemin={{handle.min}}
            aria-valuemax={{handle.max}}
            aria-valuenow={{handle.value}}
            aria-valuetext={{handle.text}}
            data-handle={{handle.id}}
            data-test-waveform-handle={{handle.id}}
            {{cssVars x=handle.x tab-left=handle.tabLeft tab-top=handle.tabTop}}
            {{on "focus" (fn this.focusHandle handle)}}
            {{on "keydown" (fn this.onHandleKey handle)}}
          >
            <span class="waveform__handle-line"></span>
            <span class="waveform__handle-tab">{{handle.mark}}</span>
          </div>
        {{/each}}

        {{#each SLOTS as |slot|}}
          <span
            class="waveform__cursor"
            data-slot={{slot}}
            {{this.registerCursor}}
          ></span>
        {{/each}}
      </div>

      {{#if this.zoomed}}
        <div
          class="waveform__mini"
          role="presentation"
          title="The part of the sound in view. Press to look elsewhere."
          data-test-waveform-mini
          {{on "click" this.onMini}}
        >
          <span
            class="waveform__mini-view"
            {{cssVars left=this.miniLeft width=this.miniWidth}}
          ></span>
        </div>
      {{/if}}

      {{#if this.showHint}}
        <p class="waveform__hint" data-test-waveform-hint>
          <span class="waveform__key waveform__key--region">S</span>
          <span>to</span>
          <span class="waveform__key waveform__key--region">E</span>
          <span>is what <code>trigger()</code> plays;</span>
          <span class="waveform__key waveform__key--slice"></span>
          <span>a slice is what
            <code>trigger(&#123; slice })</code>
            plays.</span>
        </p>
      {{/if}}

      <div class="waveform__values">
        <label class="waveform__field waveform__unit">
          <span class="sr-only">Unit for start, end and loop points</span>
          <select
            class="select waveform__select"
            data-test-waveform-unit
            {{on "change" this.setUnit}}
          >
            {{#each this.units as |unit|}}
              <option
                value={{unit.value}}
                selected={{eq unit.value this.unit}}
              >{{unit.label}}</option>
            {{/each}}
          </select>
        </label>
        {{#each this.readouts key="id" as |readout|}}
          <span
            class="waveform__value waveform__value--number
              {{if readout.faint 'waveform__value--faint'}}"
            data-test-waveform-value={{readout.id}}
          >
            <span>{{readout.name}}</span>
            <NumberEntry
              @text={{readout.text}}
              @label={{readout.name}}
              @onCommit={{fn this.commit readout.id}}
            />
          </span>
        {{/each}}
        {{#if (this.control "loop")}}
          <span class="waveform__value waveform__value--switch">
            <span>Loop</span>
            <Toggle
              @checked={{this.isOn "loop"}}
              @label="Loop"
              @onChange={{fn this.setToggle "loop"}}
              data-test-waveform-loop
            />
          </span>
        {{/if}}
        {{#if (this.control "reverse")}}
          <span class="waveform__value waveform__value--switch">
            <span>Reverse</span>
            <Toggle
              @checked={{this.isOn "reverse"}}
              @label="Reverse"
              @onChange={{fn this.setToggle "reverse"}}
              data-test-waveform-reverse
            />
          </span>
        {{/if}}
        {{#if (this.control "speed")}}
          <span class="waveform__value waveform__value--switch">
            <span>Speed</span>
            <NumberEntry
              @text={{this.speedText}}
              @label="Speed"
              @onCommit={{this.commitSpeed}}
            />
          </span>
        {{/if}}
      </div>
    </section>
  </template>
}
