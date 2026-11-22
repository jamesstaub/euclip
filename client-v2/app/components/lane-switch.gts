import Component from '@glimmer/component';
import { on } from '@ember/modifier';
import Icon from 'client-v2/components/icon';
import type { ControlView } from 'client-v2/audio/runner';

export interface LaneSwitchSignature {
  Element: HTMLDivElement;
  Args: {
    /** what the editor shows when no lane is over it: `Waveform`, `Keyboard` */
    picture: string;
    /** its icon */
    icon: 'sound' | 'keys';
    /** the control whose lane the steps button shows */
    control: ControlView;
    /** a lane is over the editor */
    open: boolean;
    /** some value of the editor has steps of their own: the steps button is blue */
    active: boolean;
    onPicture: () => void;
    onLanes: () => void;
  };
}

/**
 * A source editor's two square buttons: its picture (the waveform, the keyboard), or the lane of the
 * value last touched in its place. One is pressed, always; pressing the other switches.
 */
export default class LaneSwitch extends Component<LaneSwitchSignature> {
  get lanesLabel(): string {
    const lane = this.args.control.lane;
    return `${this.args.control.label} steps${
      lane && lane.locked > 0 ? ` (${lane.locked} of ${lane.steps} set)` : ''
    }`;
  }

  <template>
    <div
      class="lane-switch"
      role="group"
      aria-label="Show"
      data-test-lane-switch
      ...attributes
    >
      <button
        type="button"
        class="lane-switch__button"
        aria-pressed={{if @open "false" "true"}}
        aria-label={{@picture}}
        title={{@picture}}
        data-test-lane-switch-picture
        {{on "click" @onPicture}}
      ><Icon @name={{@icon}} /></button>
      <button
        type="button"
        class="lane-switch__button lane-button"
        aria-pressed={{if @open "true" "false"}}
        aria-label={{this.lanesLabel}}
        title={{this.lanesLabel}}
        data-active={{if @active "true"}}
        data-test-lane-switch-lanes
        {{on "click" @onLanes}}
      ><Icon @name="multislider" /></button>
    </div>
  </template>
}
