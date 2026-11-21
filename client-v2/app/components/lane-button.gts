import Component from '@glimmer/component';
import { on } from '@ember/modifier';
import Icon from 'client-v2/components/icon';
import type { ControlView } from 'client-v2/audio/runner';

export interface LaneButtonSignature {
  Element: HTMLButtonElement;
  Args: {
    control: ControlView;
    /** the lane is showing */
    pressed: boolean;
    onToggle: () => void;
    /** false: no count of the steps set beside the icon (a small cell has no room; its colour says so) */
    count?: boolean;
  };
}

/**
 * A control's lane button (v1's multislider): shows and hides the control's lane, its value on every
 * step. Blue with a count while steps hold values of their own, so a control whose steps override it
 * says so wherever it is drawn (a control row, a value cell of the waveform editor).
 */
export default class LaneButton extends Component<LaneButtonSignature> {
  get locked(): number {
    return this.args.control.lane?.locked ?? 0;
  }

  get showCount(): boolean {
    return this.args.count !== false && this.locked > 0;
  }

  get label(): string {
    const lane = this.args.control.lane;
    return `${this.args.pressed ? 'Hide' : 'Show'} ${this.args.control.label} steps${
      lane && lane.locked > 0 ? ` (${lane.locked} of ${lane.steps} set)` : ''
    }`;
  }

  <template>
    <button
      type="button"
      class="lane-button"
      aria-pressed={{if @pressed "true" "false"}}
      aria-label={{this.label}}
      title={{this.label}}
      data-active={{if this.locked "true"}}
      data-test-lane-button
      ...attributes
      {{on "click" @onToggle}}
    >
      <Icon @name="multislider" />
      {{#if this.showCount}}
        <span
          class="lane-button__count"
          data-test-lane-count
        >{{this.locked}}</span>
      {{/if}}
    </button>
  </template>
}
