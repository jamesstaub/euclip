import Knob from 'client-v2/components/ui/knob';
import { NumberWidget } from 'client-v2/components/widgets/slider-widget';

/** The `knob` widget: a declared number control drawn as a dial. */
export default class KnobWidget extends NumberWidget {
  <template>
    <Knob
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
