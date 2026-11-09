import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { htmlSafe } from '@ember/template';

const STEP_WIDTH = 32.2; // px per step

const DEFAULT_HEIGHT = 140; // before the space has been measured
const MIN_HEIGHT = 56;
const MAX_HEIGHT = 240;

/**
 * One slider per step of the sequence. It draws as tall as the space it is in (down to a minimum), so the bars
 * can never run out of their container however short the footer is.
 */
export default class ControlsMultisliderComponent extends Component {
  @tracked height = DEFAULT_HEIGHT;

  // as wide as its steps: the sliders are drawn in a child that takes no space, so the box has to say how wide it is
  get width() {
    return Math.round((this.args.sequence?.length ?? 0) * STEP_WIDTH);
  }

  get boxStyle() {
    return htmlSafe(`width: ${this.width}px; min-height: 3.5rem`);
  }

  @action
  setHeight(available) {
    if (!available) return;
    this.height = Math.min(Math.max(available, MIN_HEIGHT), MAX_HEIGHT);
  }
}
