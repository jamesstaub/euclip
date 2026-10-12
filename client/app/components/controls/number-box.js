import Component from '@glimmer/component';

const FALLBACK_LIMIT = 1e6;
const FALLBACK_STEP = 0.01;

const finite = (n, fallback) => (Number.isFinite(n) ? n : fallback);

export default class ControlsNumberBoxComponent extends Component {
  // `or` in the template treated 0 as missing, so a min or max of 0 was replaced
  // by +/-20000 and drags produced arbitrary values
  get min() {
    return finite(this.args.min, -FALLBACK_LIMIT);
  }

  get max() {
    return finite(this.args.max, FALLBACK_LIMIT);
  }

  // Units a mouse drag changes the value by per pixel: a third of a step at least, and
  // enough to sweep a bounded range in a few hundred pixels
  get dragPerPixel() {
    if (Number.isFinite(this.args.dragPerPixel)) return this.args.dragPerPixel;
    const range = this.max - this.min;
    const bounded = range > 0 && range < FALLBACK_LIMIT;
    return Math.max(this.step / 3, bounded ? range / 300 : 0);
  }

  get step() {
    const step = this.args.stepSize;
    return Number.isFinite(step) && step > 0 ? step : FALLBACK_STEP;
  }
}
