import Component from '@glimmer/component';
import { service } from '@ember/service';
import Toggle from 'client-v2/components/ui/toggle';
import type { ControlWidgetSignature } from 'client-v2/components/widgets/slider-widget';
import type AudioService from 'client-v2/services/audio';

/** The `toggle` widget: a declared true-or-false control drawn as a switch. */
export default class ToggleWidget extends Component<ControlWidgetSignature> {
  @service declare audio: AudioService;

  get checked(): boolean {
    return this.args.control.value === true;
  }

  get effective(): boolean | null {
    const effective = this.args.control.effective;
    return typeof effective === 'boolean' ? effective : null;
  }

  change = (checked: boolean): void =>
    this.audio.setControl(this.args.scopeId, this.args.control.key, checked);

  <template>
    <Toggle
      @checked={{this.checked}}
      @label={{@control.label}}
      @effective={{this.effective}}
      @onChange={{this.change}}
      ...attributes
    />
  </template>
}
