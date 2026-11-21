import Component from '@glimmer/component';
import { service } from '@ember/service';
import Slider from 'client-v2/components/ui/slider';
import type { ControlView } from 'client-v2/audio/runner';
import { mapping, type Mapping } from 'client-v2/controls/modes';
import { numberOf } from 'client-v2/controls/view';
import type AudioService from 'client-v2/services/audio';

/** What every widget that draws a control bound to one value is given. */
export interface ControlWidgetSignature {
  Element: HTMLElement;
  Args: {
    /** the scope (a track's id, or the project's) whose script declared it */
    scopeId: string;
    control: ControlView;
    /** opens the control's menu: for a long press or a right click on the widget */
    onMenu?: () => void;
    /**
     * Where a value set goes, in place of the control's own value: a chosen step's (the control row
     * while a step is being edited). Absent: the control's value.
     */
    onSet?: (value: number | boolean) => void;
    /** what a reset (a double click) does in place of forgetting the control's value */
    onReset?: () => void;
  };
}

/** What the number widgets (slider, knob) share: the mapping, and what moving and resetting do. */
export class NumberWidget extends Component<ControlWidgetSignature> {
  @service declare audio: AudioService;

  get mapping(): Mapping {
    const meta = this.args.control.meta;
    return mapping(
      this.args.control.mode,
      meta.kind === 'number' ? meta : { min: 0, max: 1 },
    );
  }

  get value(): number {
    return numberOf(this.args.control.value);
  }

  get effective(): number | null {
    const effective = this.args.control.effective;
    return typeof effective === 'number' ? effective : null;
  }

  change = (value: number): void =>
    this.args.onSet
      ? this.args.onSet(value)
      : this.audio.setControl(this.args.scopeId, this.args.control.key, value);

  reset = (): void =>
    this.args.onReset
      ? this.args.onReset()
      : this.audio.resetControl(this.args.scopeId, this.args.control.key);

  menu = (): void => this.args.onMenu?.();
}

/** The `slider` widget: a declared number control drawn as a horizontal slider. */
export default class SliderWidget extends NumberWidget {
  <template>
    <Slider
      @value={{this.value}}
      @mapping={{this.mapping}}
      @label={{@control.label}}
      @effective={{this.effective}}
      @onChange={{this.change}}
      @onReset={{this.reset}}
      @onMenu={{this.menu}}
      ...attributes
    />
  </template>
}
