import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';

// the markers can't be dragged closer than this fraction of the sample
const MIN_GAP = 0.01;

const clamp01 = (n) => Math.min(Math.max(n, 0), 1);

/**
 * A sampler's waveform with draggable start and end markers, the sample's onsets (where it can be cut
 * into slices) and the controls for them. The controls stay the source of truth: a marker is just another
 * way to set start and end, in whatever unit they are in (seconds, ms, loop steps, % of the sample), so
 * the sliders, the script and the markers always agree.
 *
 *   snap        (a toggle) makes the markers jump to the nearest onset, or the start/end of the file
 *   threshold   how sensitive onset detection is for this sample (saved with the sample in the pool)
 *   loop        when the sampler isn't looping the markers are drawn in a disabled colour
 */
export default class ControlsWaveformSurfaceComponent extends Component {
  @service samplePool;

  get duration() {
    return this.args.buffer.duration;
  }

  // position along the sample, 0-1, of a control's current value
  fractionOf(control) {
    const seconds = control.attrValueForType();
    return Number.isFinite(seconds) && this.duration > 0 ? clamp01(seconds / this.duration) : 0;
  }

  get startFraction() {
    return this.fractionOf(this.args.startControl);
  }

  get endFraction() {
    return this.fractionOf(this.args.endControl);
  }

  get shadeLeftStyle() {
    return `width: ${this.startFraction * 100}%`;
  }

  get shadeRightStyle() {
    return `width: ${(1 - this.endFraction) * 100}%`;
  }

  get startHandleStyle() {
    return `left: ${this.startFraction * 100}%`;
  }

  get endHandleStyle() {
    return `left: ${this.endFraction * 100}%`;
  }

  get startSeconds() {
    return this.startFraction * this.duration;
  }

  get endSeconds() {
    return this.endFraction * this.duration;
  }

  // ---- looping ----

  get isLooping() {
    const control = this.args.loopControl;
    return control ? control.controlValue > 0 : true;
  }

  // ---- onsets and slices ----

  get boundaries() {
    return this.args.trackNode?.sliceBoundaries ?? [];
  }

  get sliceCount() {
    return this.args.trackNode?.sliceCount ?? 0;
  }

  // the cut points inside the file (not its start or end), as markers along the waveform
  get onsetMarkers() {
    const duration = this.duration;
    return this.boundaries
      .slice(1, -1)
      .map((time, i) => ({ index: i + 1, time, style: `left: ${(time / duration) * 100}%` }));
  }

  // the slice region the slice controls ask for right now (a script may be changing it every step)
  get activeSliceStyle() {
    const region = this.args.trackNode?.sliceRegion();
    if (!region) return undefined;
    const left = (region.start / this.duration) * 100;
    const width = ((region.end - region.start) / this.duration) * 100;
    return `left: ${left}%; width: ${width}%`;
  }

  // ---- snap ----

  get snapOn() {
    const control = this.args.snapControl;
    return control ? control.controlValue > 0 : false;
  }

  @action
  toggleSnap(event) {
    this.args.onChange(this.args.snapControl, event.target.checked);
  }

  // The nearest cut point to `fraction` (0-1): an onset, or the start or end of the file. The start marker may
  // not pass the end marker and vice versa, so only points on its side of the other one count.
  snapped(which, fraction) {
    const duration = this.duration;
    const points = this.boundaries.map((time) => time / duration);
    if (!points.length) return fraction;

    const allowed = points.filter((point) =>
      which === 'start' ? point <= this.endFraction - MIN_GAP : point >= this.startFraction + MIN_GAP
    );
    if (!allowed.length) return fraction;
    return allowed.reduce((best, point) => (Math.abs(point - fraction) < Math.abs(best - fraction) ? point : best));
  }

  // ---- the onset threshold ----

  get sample() {
    return this.args.trackNode?.poolSample;
  }

  get threshold() {
    return this.sample?.onsetThreshold ?? this.args.trackNode?.poolAudio?.threshold ?? 0.25;
  }

  @action
  setThreshold(event) {
    if (!this.sample) return;
    this.samplePool.setOnsetThreshold(this.sample, Number(event.target.value));
  }

  // ---- dragging ----

  @action
  beginDrag(which, event) {
    event.preventDefault();
    const handle = event.currentTarget;
    const rect = handle.parentElement.getBoundingClientRect();
    handle.setPointerCapture(event.pointerId);

    const move = (e) => this.dragTo(which, (e.clientX - rect.left) / rect.width);
    const stop = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', stop);
      handle.removeEventListener('pointercancel', stop);
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', stop);
    handle.addEventListener('pointercancel', stop);
  }

  dragTo(which, fraction) {
    const isStart = which === 'start';
    const control = isStart ? this.args.startControl : this.args.endControl;
    const wanted = this.snapOn ? this.snapped(which, clamp01(fraction)) : clamp01(fraction);
    const limited = isStart
      ? Math.min(wanted, this.endFraction - MIN_GAP)
      : Math.max(wanted, this.startFraction + MIN_GAP);

    const seconds = Math.max(limited, 0) * this.duration;
    const value = Math.round((seconds / control.unitScale) * 10000) / 10000;
    this.args.onChange(control, Math.min(Math.max(value, control.min), control.max));
  }
}
