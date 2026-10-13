import Component from '@glimmer/component';
import { action } from '@ember/object';
import { fromNormalized, snapToStep, toNormalized } from '../../utils/param-scale';

// resolution of a log-scaled slider (positions 0-1)
const LOG_STEP = 0.001;

export default class ControlsSliderComponent extends Component {
  // Nexus computes the slider geometry from (value - min) / (max - min),
  // so a missing bound or min === max yields NaN SVG attributes
  get min() {
    const min = this.args.min;
    return Number.isFinite(min) ? min : 0;
  }

  get max() {
    const { max } = this.args;
    const min = this.min;
    return Number.isFinite(max) && max > min ? max : min + 1;
  }

  get stepSize() {
    const step = this.args.stepSize;
    return Number.isFinite(step) && step > 0 ? step : 0.01;
  }

  get range() {
    return { min: this.min, max: this.max, scale: this.args.scale };
  }

  // A log-scaled param (frequency) is dragged along a 0-1 position and converted back to real
  // values, so the slider spends as much travel on 20-200 Hz as on 2000-20000 Hz. The number box
  // next to it always shows and edits the real value.
  get isLog() {
    return this.args.scale === 'log';
  }

  get sliderMin() {
    return this.isLog ? 0 : this.min;
  }

  get sliderMax() {
    return this.isLog ? 1 : this.max;
  }

  get sliderStep() {
    return this.isLog ? LOG_STEP : this.stepSize;
  }

  get sliderValue() {
    return this.isLog ? toNormalized(this.args.value, this.range) : this.args.value;
  }

  // 0-100 position of the onstep script's modulated value along the slider, or undefined
  get modulationPercent() {
    const value = this.args.modulatedValue;
    if (!Number.isFinite(value)) return undefined;
    return Math.round(toNormalized(value, this.range) * 1000) / 10;
  }

  get modulationStyle() {
    const pct = this.modulationPercent;
    if (pct === undefined) return undefined;
    // a horizontal slider is driven along its width: left to right (the marker is vertically centred)
    return this.args.horizontal
      ? `left: ${pct}%; top: 50%; bottom: auto; margin: -7px 0 0 -7px`
      : `bottom: ${pct}%`;
  }

  @action
  onChangeSlider(value) {
    if (!this.isLog) return this.args.onChange(value);

    // Nexus echoes a programmatic value back as a change event; at this resolution that would nudge
    // the real value, so only act on a position the user actually moved to
    if (Math.abs(value - this.sliderValue) < LOG_STEP) return;
    const real = fromNormalized(value, this.range);
    this.args.onChange(snapToStep(real, this.stepSize, this.min));
  }
}
