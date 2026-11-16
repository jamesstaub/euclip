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
import Hint from 'client-v2/components/ui/hint';
import NumberEntry from 'client-v2/components/ui/number-entry';
import PopupMenu, { type MenuItem } from 'client-v2/components/ui/popup-menu';
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
import { REGION_GAP } from 'client-v2/controls/live-range';
import { unitMenuItems } from 'client-v2/controls/unit-menu';
import { mappingOf, numberOf } from 'client-v2/controls/view';
import cssVars from 'client-v2/modifiers/css-vars';
import selectOptions, {
  type SelectOption,
} from 'client-v2/modifiers/select-options';
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

type ValueCell =
  | {
      id: HandleId | 'speed';
      number: true;
      name: string;
      short: string;
      text: string;
      value: number;
      map: Mapping;
      position: number;
      faint: boolean;
    }
  | { id: 'loop' | 'reverse'; number: false; name: string; short: string };

interface ValueGroup {
  id: 'speed' | 'time' | 'toggles';
  /** its accessible name */
  name: string;
  cells: ValueCell[];
}

/** The other point of a pair: the region's start and end, the loop's start and end. */
const PARTNER: Readonly<Record<HandleId, HandleId>> = {
  start: 'end',
  end: 'start',
  loopStart: 'loopEnd',
  loopEnd: 'loopStart',
};

/** The entry of the sound picker that is not a sound: it opens the sound browser. */
const BROWSE = '~browse';

const HANDLE_MARKS: Readonly<Record<HandleId, string>> = {
  start: 'S',
  end: 'E',
  loopStart: 'L',
  loopEnd: 'L',
};

const SNAPS: readonly { value: Snap; label: string }[] = [
  { value: 'zero', label: 'Zero crossing' },
  { value: 'slices', label: 'Slices' },
  { value: 'off', label: 'None' },
];

const TEMPO_STEPS = ['1/4', '1/8', '1/16', '1/32'] as const;

const TEMPO_CHOICES: readonly SelectOption[] = TEMPO_STEPS.map((step) => ({
  value: step,
  label: step,
}));

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
  /**
   * What handles and new boundaries snap to. Until the person says, it follows the sound: its slices
   * when it has some, else the zero crossings of its audio. A choice is kept for this waveform (with
   * how things are looked at: view.ts), and from then on it is the person's.
   */
  get snap(): Snap {
    const chosen = this.view.chosenSnap(
      this.args.scopeId,
      this.args.waveform.key,
    );
    if (chosen === 'zero' || chosen === 'slices' || chosen === 'off') {
      return chosen;
    }
    return this.slices.length > 2 ? 'slices' : 'zero';
  }
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
    this.miniGesture.release();
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
    if (!sound) return 'No sound is chosen for this sampler.';
    const entry = this.pool.find((candidate) => candidate.name === sound.key);
    if (entry?.state === 'missing') {
      return `The file of “${sound.key}” is not in this browser. Supply it again from This project in the sound browser.`;
    }
    if (sound.state === 'error' || entry?.state === 'error') {
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

  /** The units on offer, as the unit menu lists them. */
  get units(): readonly SelectOption[] {
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

  /**
   * The values under the picture, in their order: speed, the region, the loop with its two points
   * beside its switch, reverse. Every cell is always there (a loop point while the loop is off is
   * shown faint): nothing changes place.
   */
  get groups(): ValueGroup[] {
    // (`short`: what a narrow cell says. A loop point sits beside the Loop switch there: from, to.)
    const number = (
      id: HandleId | 'speed',
      name: string,
      short = name,
    ): ValueCell[] => {
      const control = this.control(id);
      const map = control
        ? id === 'speed'
          ? mappingOf(control)
          : this.#freeMap(control)
        : null;
      if (!control || !map) return [];
      const value = numberOf(control.value);
      return [
        {
          id,
          number: true,
          name,
          short,
          text: map.format(value),
          value,
          map,
          position: map.toPosition(value),
          // (the loop's points keep their place while the loop is off: there, but not in play)
          faint: (id === 'loopStart' || id === 'loopEnd') && !this.looping,
        },
      ];
    };
    const toggle = (
      id: 'loop' | 'reverse',
      name: string,
      short = name,
    ): ValueCell[] =>
      this.control(id) ? [{ id, number: false, name, short }] : [];
    // Left to right: the speed; the four places in the sound, which share a unit; the two switches.
    const groups: ValueGroup[] = [
      {
        id: 'speed',
        name: 'Speed',
        cells: number('speed', 'Speed'),
      },
      {
        id: 'time',
        name: 'Region and loop points',
        cells: [
          ...number('start', HANDLE_NAMES.start),
          ...number('end', HANDLE_NAMES.end),
          ...number('loopStart', HANDLE_NAMES.loopStart, 'L start'),
          ...number('loopEnd', HANDLE_NAMES.loopEnd, 'L end'),
        ],
      },
      {
        id: 'toggles',
        name: 'Loop and reverse',
        cells: [
          ...toggle('loop', 'Loop'),
          ...toggle('reverse', 'Reverse', 'Rev'),
        ],
      },
    ];
    return groups.filter((group) => group.cells.length > 0);
  }

  /** The speed's menu: the units its control has in the controls pane (one control, two views of it). */
  @tracked speedMenu = false;

  setSpeedMenu = (open: boolean): void => {
    this.speedMenu = open;
  };

  get speedMenuItems(): MenuItem[] {
    const control = this.control('speed');
    if (!control) return [];
    const scopeId = this.args.scopeId;
    const units = unitMenuItems(control, (choice) =>
      this.audio.chooseControlMode(scopeId, control.key, choice),
    );
    const line = control.line;
    return [
      ...units,
      {
        label: 'Reset',
        separated: units.length > 0,
        disabled: !control.stored,
        onSelect: () => this.audio.resetControl(scopeId, control.key),
      },
      {
        label: 'Show in script',
        disabled: line === undefined,
        onSelect: () => {
          if (line !== undefined) this.view.showInScript(scopeId, line);
        },
      },
    ];
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

  get hasSlices(): boolean {
    return this.ready && this.slices.length > 2;
  }

  get sliceCount(): number {
    return Math.max(1, this.slices.length - 1);
  }

  /** (the part in view, in seconds: for whoever needs to know from outside, a test or a driver) */
  get viewText(): string {
    const view = this.current;
    return `${view.start.toFixed(4)} ${view.end.toFixed(4)}`;
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
    // (the stage as it is this instant: a press can come before the resize observer has said that
    // the stage changed size, and the handles' tabs are placed from its height)
    const stage = this.#stage;
    if (
      stage &&
      (stage.clientWidth !== this.width || stage.clientHeight !== this.height)
    ) {
      this.width = stage.clientWidth;
      this.height = stage.clientHeight;
    }
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
        // (taken past its partner, the handle under the pointer is the other end from here on)
        this.active = this.moveHandle(
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

  /**
   * Moves one of the four points to a time. The region's two points, and the loop's two, are pairs:
   * a point taken past its partner does not stop there. It becomes the other end (start is always the
   * lower, end the higher), the partner takes the role it had and stays where it stood, and coming
   * back across swaps them back. The two never meet: a pair is at least REGION_GAP apart (to the
   * sampler, an end at or before its start means "the end of the sound").
   *
   * Returns the point that is at `time` afterwards: the one asked for, or after a crossing its partner.
   * A caller that goes on asking for the point it began with (a number dragged in its box) is followed
   * across for the length of its gesture.
   */
  moveHandle(
    id: HandleId,
    time: number,
    group?: string,
    snap = true,
  ): HandleId {
    const asked = id;
    const crossed = this.#crossed;
    if (
      group !== undefined &&
      crossed?.group === group &&
      crossed.asked === id
    ) {
      id = crossed.acting;
    }
    const control = this.control(id);
    if (!control || control.meta.kind !== 'number') return id;
    const meta = control.meta;
    const loop = id === 'loopStart' || id === 'loopEnd';
    const times = this.times;
    // the region's points have the whole sound; the loop's are kept inside the region, as ever
    const least = loop ? (times.start ?? meta.min) : meta.min;
    const most = Math.max(least, loop ? (times.end ?? meta.max) : meta.max);
    const hold = (value: number): number =>
      Math.min(most, Math.max(least, value));
    const wanted = hold(snap ? this.#snapped(time, true) : time);
    const partnerId = PARTNER[id];
    const partner = this.control(partnerId);
    const other = times[partnerId];
    const set = (which: ControlView, value: number): void =>
      this.audio.setControl(this.args.scopeId, which.key, value, group);
    if (!partner || other === undefined) {
      if (wanted !== control.value) set(control, wanted);
      return id;
    }
    // (+1: this point belongs above its partner; -1: below it)
    const side = id === 'end' || id === 'loopEnd' ? 1 : -1;
    if ((other - wanted) * side >= REGION_GAP) {
      // Past the partner: the pair changes hands. Both are written, as times (an end never moved
      // stands at the sound's length on screen, and is stored as that from here on), the one that
      // widens the pair first so that they are never in the wrong order on the way: the partner's
      // control takes this point's place, then this one's takes the partner's.
      set(partner, wanted);
      set(control, other);
      if (group !== undefined) {
        this.#crossed = { group, asked, acting: partnerId };
      }
      return partnerId;
    }
    // on its own side: as far as the gap from its partner, no nearer
    const value =
      (wanted - other) * side >= REGION_GAP
        ? wanted
        : hold(other + side * REGION_GAP);
    if (value === control.value) return id;
    if (id === 'loopStart') {
      // A loop end at or before the loop start means "the whole region" to the sampler, so a loop
      // start alone would do nothing: the loop end is written down where it stands, with it.
      const raw = Number(this.node?.param('loopEnd').value) || 0;
      if (!(raw > value)) set(partner, other);
    }
    set(control, value);
    return id;
  }

  /** A gesture that has taken a point across its partner: which point it asked for, and which it now moves. */
  #crossed: { group: string; asked: HandleId; acting: HandleId } | null = null;

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
    const free = this.#freeMap(handle.control) ?? handle.map;
    // (a key's step is exact: snapping would hold a handle on the boundary it stands on)
    const now = this.moveHandle(
      handle.id,
      free.toValue(next),
      undefined,
      false,
    );
    if (now !== handle.id) {
      // across its partner: the keys go on moving the same line, which is the other end now
      this.#stage
        ?.querySelector<HTMLElement>(`[data-handle="${now}"]`)
        ?.focus({ preventScroll: true });
    }
  };

  /**
   * A point's mapping over the whole sound, without the limit its partner sets: a point may be taken
   * past its partner (they change roles), so its travel does not stop there.
   */
  #freeMap(control: ControlView): Mapping | null {
    if (control.meta.kind !== 'number') return null;
    const range = { ...control.meta };
    delete range.floor;
    delete range.ceiling;
    return mapping(control.mode, range);
  }

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
    // (Escape in a menu or a field is that menu's or field's: closing its list, giving up a typed value)
    const own = (event.target as HTMLElement).closest('select, input');
    if (event.key === 'Escape' && this.expanded && !own) {
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

  /**
   * The strip under the picture: its window is dragged along to look elsewhere, the picture following
   * on every move; a press outside the window brings the window's middle there first. (It answered to
   * `click` once, which a browser sends only when the button comes up: the picture stood still until
   * then.) The view is the editor's own state: nothing is stored and there is nothing to undo.
   */
  #miniGrab = 0;
  miniGesture = new ControlGesture({
    position: () =>
      this.duration > 0 ? this.current.start / this.duration : 0,
    axis: () => 'x',
    positionAt: (event, element) => {
      const rect = element.getBoundingClientRect();
      return (event.clientX - rect.left - this.#miniGrab) / (rect.width || 1);
    },
    travel: (event, from, element) =>
      (event.clientX - from.clientX) /
      (element.getBoundingClientRect().width || 1),
    onPosition: (position) => {
      const view = this.current;
      const span = view.end - view.start;
      const start = position * this.duration;
      this.setView({ start, end: start + span });
    },
  });

  onMiniDown = (event: PointerEvent): void => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const view = this.current;
    const width = rect.width || 1;
    const left = (view.start / (this.duration || 1)) * width;
    const size = ((view.end - view.start) / (this.duration || 1)) * width;
    const x = event.clientX - rect.left;
    // on the window: it is held where it was pressed. Elsewhere: by its middle.
    this.#miniGrab = x >= left && x <= left + size ? x - left : size / 2;
    this.miniGesture.down(event);
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
    this.view.chooseSnap(
      this.args.scopeId,
      this.args.waveform.key,
      (event.target as HTMLSelectElement).value,
    );
  };

  /** The four points share a unit. Choosing one is a single step: to undo, and to draw. */
  setUnit = (event: Event): void => {
    const mode = (event.target as HTMLSelectElement).value;
    if (mode === this.unit) return;
    const group = `unit-${++this.#group}`;
    for (const id of HANDLES) {
      const control = this.control(id);
      if (control) {
        this.audio.setControlMode(this.args.scopeId, control.key, mode, group);
      }
    }
  };

  commit = (id: HandleId | 'speed', typed: string): boolean => {
    const control = this.control(id);
    if (!control) return false;
    if (id === 'speed') {
      const value = mappingOf(control)?.parse(typed);
      if (value === null || value === undefined) return false;
      this.audio.setControl(this.args.scopeId, control.key, value);
      return true;
    }
    // a point: typed past its partner it changes roles with it, as a dragged one does (one step to undo)
    const value = this.#freeMap(control)?.parse(typed);
    if (value === null || value === undefined) return false;
    this.moveHandle(id, value, `typed-${++this.#group}`, false);
    return true;
  };

  /**
   * A value dragged (or stepped with the keys) in its box. A point goes the way its handle on the
   * picture goes (the same stored value, snapped and kept on its side of the others), so the two move
   * together; a whole drag is one step to undo.
   */
  change = (id: HandleId | 'speed', value: number, gesture?: string): void => {
    if (id !== 'speed') {
      // (a drag snaps, as a handle's does; a key's step is exact)
      this.moveHandle(id, value, gesture, gesture !== undefined);
      return;
    }
    const control = this.control(id);
    if (control) {
      this.audio.setControl(this.args.scopeId, control.key, value, gesture);
    }
  };

  setToggle = (name: string, value: boolean): void => {
    const control = this.control(name);
    if (control) this.audio.setControl(this.args.scopeId, control.key, value);
  };

  isOn = (name: string): boolean => this.control(name)?.value === true;

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

  /** What the count line reads: what Apply would give, or (just applied) what the sound has. */
  get panelCount(): number {
    return this.preview ? this.previewCount : this.sliceCount;
  }

  /**
   * Makes the boundaries shown the sound's slices. The panel stays open, on its tab, as it does after
   * Clear: it is closed with the button that opened it. The preview has become the real thing, so the
   * sound's own (movable) boundaries show until a setting is changed again.
   */
  applySlices = (): void => {
    const sound = this.sound;
    if (!sound || !this.preview) return;
    this.audio.setSlices(sound.key, this.preview);
    this.selected = -1;
    this.preview = null;
  };

  /**
   * Removes every slice of the sound (one step to undo). The panel, its tab and its setting stay as
   * they are, preview included: this is where the next cut is set up.
   */
  clearSlices = (): void => {
    const sound = this.sound;
    if (!sound || !this.hasSlices) return;
    this.audio.setSlices(sound.key, []);
    this.selected = -1;
    if (this.panel && !this.preview) this.#refreshPreview();
  };

  /** The script's waveforms, for the picker that stands in for the list of them where there is no room. */
  get otherChoices(): readonly SelectOption[] {
    return (this.args.others ?? []).map(({ key, label }) => ({
      value: key,
      label,
    }));
  }

  /** The project's sounds, as the sound menu lists them (and "no sound", for a sampler that has none). */
  get soundChoices(): readonly SelectOption[] {
    const sounds = this.pool.map((entry) => ({
      value: entry.name,
      label: poolLabel(entry),
    }));
    return [
      ...(this.sound ? [] : [{ value: '', label: 'no sound chosen' }]),
      ...sounds,
      // (the library and the person's own sounds are in the sidebar: this opens it, aimed here)
      { value: BROWSE, label: 'Browse…' },
    ];
  }

  get soundValue(): string {
    return this.sound?.key ?? '';
  }

  get several(): boolean {
    return (this.args.others?.length ?? 0) > 1;
  }

  chooseOther = (event: Event): void =>
    this.args.onChoose?.((event.target as HTMLSelectElement).value);

  // --- which sound -----------------------------------------------------------------------------------

  get pool(): readonly PoolEntry[] {
    return this.audio.pool();
  }

  chooseSound = (event: Event): void => {
    const menu = event.target as HTMLSelectElement;
    const name = menu.value;
    if (name === BROWSE) {
      menu.value = this.soundValue;
      this.browse();
      return;
    }
    if (name && name !== this.sound?.key) {
      this.audio.setControl(
        this.args.scopeId,
        this.args.waveform.soundKey,
        name,
      );
    }
  };

  /** Opens the sound browser on the library, with Use aimed at this sampler. */
  browse = (): void =>
    this.view.browseSounds(this.args.scopeId, this.args.waveform.key);

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
      data-view={{this.viewText}}
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
              {{selectOptions this.otherChoices @waveform.key}}
            ></select>
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
                {{selectOptions this.soundChoices this.soundValue}}
              ></select>
            </label>
            {{#if @waveform.soundDefault}}
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
          <Hint @label="About the waveform editor" data-test-waveform-hint>
            <p><span class="waveform__key waveform__key--region">S</span>
              to
              <span class="waveform__key waveform__key--region">E</span>
              is the region: what
              <code>trigger()</code>
              plays.
              <span class="waveform__key waveform__key--slice"></span>
              marks a slice: what
              <code>trigger(&#123; slice })</code>
              plays. Both are always there.</p>
            <p>Slices belong to the sound: every track that plays it shares
              them. Drag a flag in the ruler to move one, double-click the sound
              to add one, select one and press Delete to remove it. Slices
              offers three ways to cut the whole sound; what it would give is
              shown dashed in red until you apply.</p>
            <p>Tap the sound to hear that slice. Pinch, or Ctrl and the wheel,
              zooms; drag the sound to scroll. Double-click a handle to put it
              back where the script has it. Expand gives the editor the whole
              screen.</p>
          </Hint>
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
            class="btn btn--s"
            aria-label="Zoom out"
            disabled={{if this.zoomed false true}}
            data-test-zoom-out
            {{on "click" this.zoomOut}}
          >−</button>
          <button
            type="button"
            class="btn btn--s"
            aria-label="Zoom in"
            data-test-zoom-in
            {{on "click" this.zoomIn}}
          >+</button>
          <button
            type="button"
            class="btn btn--s"
            title="Zoom to what the sampler plays"
            data-test-zoom-region
            {{on "click" this.zoomRegion}}
          >Region</button>
          <button
            type="button"
            class="btn btn--s"
            title="Show the whole sound"
            disabled={{if this.zoomed false true}}
            data-test-zoom-all
            {{on "click" this.zoomAll}}
          >All</button>
        </div>
        <div class="waveform__tool-group waveform__tool-group--more">
          <label class="waveform__snap">
            <span data-test-snap-label>Snap</span>
            <select
              class="select waveform__select"
              data-test-snap
              {{on "change" this.setSnap}}
              {{selectOptions SNAPS this.snap}}
            ></select>
          </label>
        </div>
        <div class="waveform__tool-group waveform__tool-group--more">
          <button
            type="button"
            class="btn btn--s waveform__disclosure {{if this.panel 'is-open'}}"
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
            class="btn btn--s"
            title="Add a slice boundary where you last pressed (or double-click the sound)"
            data-test-slice-add
            {{on "click" this.addMarker}}
          >Add</button>
          <button
            type="button"
            class="btn btn--s"
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
                  {{selectOptions TEMPO_CHOICES this.tempoStep}}
                ></select>
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
            <b
              class="waveform__count"
              title="Shown dashed in red over the sound until you apply"
              data-test-slices-count
            >{{this.panelCount}}
              {{if (eq this.panelCount 1) "slice" "slices"}}</b>
            <button
              type="button"
              class="btn btn--s waveform__apply"
              disabled={{if this.preview false true}}
              data-test-slices-apply
              {{on "click" this.applySlices}}
            >Apply</button>
            <button
              type="button"
              class="btn btn--s"
              title="Remove every slice boundary: the sound is one slice again"
              disabled={{if this.hasSlices false true}}
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
          <p class="waveform__empty" data-test-waveform-empty>{{this.emptyText}}
            {{#unless this.sound}}
              <button
                type="button"
                class="btn btn--s"
                data-test-waveform-browse
                {{on "click" this.browse}}
              >Choose a sound</button>
            {{/unless}}</p>
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
          title="The part of the sound in view. Drag it, or press elsewhere, to look there."
          data-test-waveform-mini
          {{on "pointerdown" this.onMiniDown}}
        >
          <span
            class="waveform__mini-view"
            {{cssVars left=this.miniLeft width=this.miniWidth}}
          ></span>
        </div>
      {{/if}}

      <div class="waveform__values">
        {{#each this.groups key="id" as |group|}}
          <div
            class="waveform__group waveform__group--{{group.id}}"
            role="group"
            aria-label={{group.name}}
            data-test-waveform-group={{group.id}}
          >
            {{#if (eq group.id "time")}}
              {{! the unit is this group's: it changes how these four are shown, and nothing else }}
              <label class="waveform__field waveform__unit">
                <span class="sr-only">Unit for start, end and loop points</span>
                <select
                  class="select waveform__select"
                  data-test-waveform-unit
                  {{on "change" this.setUnit}}
                  {{selectOptions this.units this.unit}}
                ></select>
              </label>
            {{/if}}
            {{#each group.cells key="id" as |cell|}}
              {{#if cell.number}}
                {{#if (eq cell.id "loopStart")}}
                  {{! (where the group is two rows: what the second row is) }}
                  <span
                    class="waveform__caption
                      {{if cell.faint 'waveform__value--faint'}}"
                    aria-hidden="true"
                  >Loop points</span>
                {{/if}}
                <span
                  class="waveform__value waveform__value--number waveform__value--{{cell.id}}
                    {{if cell.faint 'waveform__value--faint'}}"
                  data-test-waveform-value={{cell.id}}
                >
                  <span class="waveform__label" title={{cell.name}}>
                    <span class="waveform__label-full">{{cell.name}}</span>
                    <span
                      class="waveform__label-short"
                      aria-hidden="true"
                    >{{cell.short}}</span>
                  </span>
                  <NumberEntry
                    @text={{cell.text}}
                    @label={{cell.name}}
                    @disabled={{cell.faint}}
                    @value={{cell.value}}
                    @mapping={{cell.map}}
                    @onChange={{fn this.change cell.id}}
                    @onCommit={{fn this.commit cell.id}}
                  />
                  {{#if (eq cell.id "speed")}}
                    <PopupMenu
                      class="waveform__speed-menu"
                      @label="Speed menu"
                      @items={{this.speedMenuItems}}
                      @open={{this.speedMenu}}
                      @onOpenChange={{this.setSpeedMenu}}
                      @up={{true}}
                      data-test-speed-menu
                    />
                  {{/if}}
                  <span
                    class="waveform__meter"
                    {{cssVars pos=cell.position}}
                  ></span>
                </span>
              {{else}}
                <span
                  class="waveform__value waveform__value--switch"
                  data-test-waveform-value={{cell.id}}
                >
                  <span class="waveform__label" title={{cell.name}}>
                    <span class="waveform__label-full">{{cell.name}}</span>
                    <span
                      class="waveform__label-short"
                      aria-hidden="true"
                    >{{cell.short}}</span>
                  </span>
                  {{#if (eq cell.id "loop")}}
                    <Toggle
                      @checked={{this.isOn "loop"}}
                      @label="Loop"
                      @onChange={{fn this.setToggle "loop"}}
                      data-test-waveform-loop
                    />
                  {{else}}
                    <Toggle
                      @checked={{this.isOn "reverse"}}
                      @label="Reverse"
                      @onChange={{fn this.setToggle "reverse"}}
                      data-test-waveform-reverse
                    />
                  {{/if}}
                </span>
              {{/if}}
            {{/each}}
          </div>
        {{/each}}
      </div>
    </section>
  </template>
}
