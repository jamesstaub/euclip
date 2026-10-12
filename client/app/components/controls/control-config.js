import Component from '@glimmer/component';
import { action } from '@ember/object';

const MIN_STEP = 0.0001;

function decimalPlaces(n) {
  if (!Number.isFinite(n) || Number.isInteger(n)) return 0;
  const [, frac = ''] = String(n).split('.');
  return Math.min(frac.length, 6);
}

function round(n, places) {
  return Number(n.toFixed(places));
}

export default class ControlsControlConfigComponent extends Component {
  get stepSize() {
    return this.args.trackControl.stepSize;
  }

  // Units per pixel for the min, max and default boxes: they have no bounds of their own,
  // so size drags by the control's current range
  get dragPerPixel() {
    const { min, max, stepSize } = this.args.trackControl;
    const range = Math.abs(max - min);
    return Math.max(stepSize / 3, Number.isFinite(range) ? range / 200 : 0);
  }

  // Drag increment for the stepSize box itself: the power of ten at or below
  // the current step, so 0.25 -> 0.1, 1 -> 1, 0.0125 -> 0.01
  get stepSizeIncrement() {
    const step = this.args.trackControl.stepSize;
    if (!(step > 0)) return MIN_STEP;
    return Math.max(MIN_STEP, Math.pow(10, Math.floor(Math.log10(step))));
  }

  @action
  setControlProperty(key, val) {
    const control = this.args.trackControl;
    if (control.get(key) === val) return;

    if (typeof val === 'number') {
      if (!Number.isFinite(val)) return;
      if (key === 'stepSize') {
        // Nexus snaps to its own min offset (0.0001 + n * 0.001); snap to the increment instead
        const inc = this.stepSizeIncrement;
        val = Math.max(MIN_STEP, Math.round(val / inc) * inc);
      }
      // drop float noise from dragging (0.30000000000000004)
      const places = Math.max(
        decimalPlaces(key === 'stepSize' ? val : control.stepSize),
        decimalPlaces(val)
      );
      val = round(val, places);
    }

    control.set(key, val);

    if (key === 'min' && control.min > control.max) {
      control.set('max', control.min);
    } else if (key === 'max' && control.max < control.min) {
      control.set('min', control.max);
    }

    // keep the default, and the live value, inside the range
    if (['min', 'max', 'defaultValue'].includes(key)) {
      if (key === 'defaultValue') {
        control.setMinMaxByDefault();
      } else {
        control.defaultValue = clamp(
          control.defaultValue,
          control.min,
          control.max
        );
      }
      if (Number.isFinite(control.controlValue)) {
        control.controlValue = clamp(
          control.controlValue,
          control.min,
          control.max
        );
      }
    }

    control.saveTrackControl.perform();
  }
}

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}
