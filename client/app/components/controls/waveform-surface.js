import Component from '@glimmer/component';
import { action } from '@ember/object';

// the markers can't be dragged closer than this fraction of the sample
const MIN_GAP = 0.01;

const clamp01 = (n) => Math.min(Math.max(n, 0), 1);

/**
 * A sampler's waveform with draggable start and end markers. The two controls stay the source of
 * truth: a marker is just another way to set them, in whatever unit they are in (seconds, ms, loop
 * steps, % of the sample), so the sliders, the script and the markers always agree.
 */
export default class ControlsWaveformSurfaceComponent extends Component {
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
    const limited = isStart
      ? Math.min(clamp01(fraction), this.endFraction - MIN_GAP)
      : Math.max(clamp01(fraction), this.startFraction + MIN_GAP);

    const seconds = Math.max(limited, 0) * this.duration;
    const value = Math.round((seconds / control.unitScale) * 10000) / 10000;
    this.args.onChange(control, Math.min(Math.max(value, control.min), control.max));
  }
}
