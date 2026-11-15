/**
 * Draws the waveform editor's picture on a canvas: the ruler, the sound, what is outside the region
 * (dimmed), the loop (tinted), and the slice boundaries. The handles and the play cursor are elements
 * over the canvas, so moving them does not redraw the sound.
 *
 * Everything is in CSS pixels; the context is scaled once for the device's pixel ratio by the caller.
 */
import type { Tick, View } from 'client-v2/waveform/geometry';
import { timeToX } from 'client-v2/waveform/geometry';

export interface Palette {
  background: string;
  ruler: string;
  rulerText: string;
  wave: string;
  /** laid over what is outside the region */
  dim: string;
  /** laid over the loop while it is on */
  loop: string;
  slice: string;
  /** a slice boundary that is selected, and boundaries being tried out (onsets not yet applied) */
  selected: string;
  preview: string;
  font: string;
}

/** Reads the palette from the element's custom properties (styles/waveform.css sets them from tokens). */
export function readPalette(element: Element): Palette {
  const style = getComputedStyle(element);
  const read = (name: string, fallback: string): string =>
    style.getPropertyValue(name).trim() || fallback;
  return {
    background: read('--wf-bg', '#333'),
    ruler: read('--wf-ruler', '#111'),
    rulerText: read('--wf-ruler-text', '#eee'),
    wave: read('--wf-wave', '#30e7ff'),
    dim: read('--wf-dim', 'rgb(17 17 17 / 62%)'),
    loop: read('--wf-loop', 'rgb(255 206 85 / 28%)'),
    slice: read('--wf-slice', '#eee'),
    selected: read('--wf-selected', '#ffce55'),
    preview: read('--wf-preview', '#ff8a85'),
    font: `${read('--wf-font-size', '10px')} ${read('--wf-font', 'sans-serif')}`,
  };
}

export interface Picture {
  width: number;
  height: number;
  /** the ruler's height: the sound is drawn below it */
  ruler: number;
  view: View;
  /** lowest and highest sample for each pixel column, or null while there is no sound to draw */
  peaks: { min: Float32Array; max: Float32Array } | null;
  region: { start: number; end: number };
  /** the loop, when it is on */
  loop: { start: number; end: number } | null;
  slices: readonly number[];
  selected: number;
  preview: readonly number[] | null;
  ticks: readonly Tick[];
}

export function paint(
  ctx: CanvasRenderingContext2D,
  picture: Picture,
  palette: Palette,
): void {
  const { width, height, ruler, view } = picture;
  const x = (time: number): number => timeToX(view, width, time);
  const bodyHeight = height - ruler;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = palette.background;
  ctx.fillRect(0, ruler, width, bodyHeight);

  // the sound: one vertical line per column, from its lowest sample to its highest
  const peaks = picture.peaks;
  if (peaks) {
    const middle = ruler + bodyHeight / 2;
    const half = bodyHeight / 2 - 2;
    const columns = peaks.min.length;
    const step = width / columns;
    ctx.fillStyle = palette.wave;
    for (let column = 0; column < columns; column++) {
      const top = middle - peaks.max[column]! * half;
      const bottom = middle - peaks.min[column]! * half;
      ctx.fillRect(
        column * step,
        top,
        Math.max(step, 1),
        Math.max(1, bottom - top),
      );
    }
  }

  // the loop, while it is on
  if (picture.loop) {
    const from = Math.max(0, x(picture.loop.start));
    const to = Math.min(width, x(picture.loop.end));
    if (to > from) {
      ctx.fillStyle = palette.loop;
      ctx.fillRect(from, ruler, to - from, bodyHeight);
    }
  }

  // what the sampler does not play
  ctx.fillStyle = palette.dim;
  const regionStart = Math.min(width, Math.max(0, x(picture.region.start)));
  const regionEnd = Math.min(width, Math.max(0, x(picture.region.end)));
  if (regionStart > 0) ctx.fillRect(0, ruler, regionStart, bodyHeight);
  if (regionEnd < width)
    ctx.fillRect(regionEnd, ruler, width - regionEnd, bodyHeight);

  // the ruler
  ctx.fillStyle = palette.ruler;
  ctx.fillRect(0, 0, width, ruler);
  ctx.fillStyle = palette.rulerText;
  ctx.font = palette.font;
  ctx.textBaseline = 'top';
  let lastLabelEnd = -Infinity;
  for (const tick of picture.ticks) {
    const at = Math.round(x(tick.time)) + 0.5;
    if (at < 0 || at > width) continue;
    ctx.globalAlpha = tick.label === null ? 0.45 : 1;
    ctx.fillRect(
      at,
      tick.label === null ? ruler - 4 : ruler - 8,
      1,
      tick.label === null ? 4 : 8,
    );
    if (tick.label !== null && at + 3 > lastLabelEnd) {
      ctx.fillText(tick.label, at + 3, 2);
      lastLabelEnd = at + 3 + ctx.measureText(tick.label).width + 6;
    }
  }
  ctx.globalAlpha = 1;

  // slice boundaries: a line down the sound and a flag in the ruler, which is where one is grabbed
  const mark = (
    time: number,
    colour: string,
    dashed: boolean,
    flag: boolean,
  ): void => {
    const at = Math.round(x(time)) + 0.5;
    if (at < -1 || at > width + 1) return;
    ctx.strokeStyle = colour;
    ctx.fillStyle = colour;
    ctx.lineWidth = 1;
    ctx.setLineDash(dashed ? [3, 3] : []);
    ctx.beginPath();
    ctx.moveTo(at, ruler);
    ctx.lineTo(at, height);
    ctx.stroke();
    ctx.setLineDash([]);
    if (flag) {
      ctx.beginPath();
      ctx.moveTo(at - 5, ruler - 9);
      ctx.lineTo(at + 5, ruler - 9);
      ctx.lineTo(at, ruler);
      ctx.closePath();
      ctx.fill();
    }
  };
  if (picture.preview) {
    for (const time of picture.preview.slice(1, -1))
      mark(time, palette.preview, true, true);
  } else {
    for (let index = 1; index < picture.slices.length - 1; index++) {
      const chosen = index === picture.selected;
      mark(
        picture.slices[index]!,
        chosen ? palette.selected : palette.slice,
        !chosen,
        true,
      );
    }
  }
}
