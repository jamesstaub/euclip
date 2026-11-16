import Component from '@glimmer/component';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import type { ControlWidgetSignature } from 'client-v2/components/widgets/slider-widget';
import selectOptions, {
  type SelectOption,
} from 'client-v2/modifiers/select-options';
import type AudioService from 'client-v2/services/audio';

/** The `select` widget: a declared control that takes one of a list of values, as a native menu. */
export default class SelectWidget extends Component<ControlWidgetSignature> {
  @service declare audio: AudioService;

  get choices(): readonly (string | number)[] {
    const meta = this.args.control.meta;
    return meta.kind === 'choice' ? meta.choices : [];
  }

  /** The choices as the menu lists them. (The menu's options are made once: see modifiers/select-options.) */
  get options(): readonly SelectOption[] {
    return this.choices.map((choice) => ({
      value: String(choice),
      label: String(choice),
    }));
  }

  get chosen(): string {
    return String(this.args.control.value);
  }

  change = (event: Event): void => {
    const chosen = (event.target as HTMLSelectElement).value;
    const choice = this.choices.find(
      (candidate) => String(candidate) === chosen,
    );
    if (choice !== undefined) {
      this.audio.setControl(this.args.scopeId, this.args.control.key, choice);
    }
  };

  <template>
    <select
      class="select"
      aria-label={{@control.label}}
      data-test-select
      ...attributes
      {{on "change" this.change}}
      {{selectOptions this.options this.chosen}}
    ></select>
  </template>
}
