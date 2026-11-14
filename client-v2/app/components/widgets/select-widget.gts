import Component from '@glimmer/component';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import type { ControlWidgetSignature } from 'client-v2/components/widgets/slider-widget';
import type AudioService from 'client-v2/services/audio';

function isChosen(value: unknown, choice: string | number): boolean {
  return value === choice;
}

function text(choice: string | number): string {
  return String(choice);
}

/** The `select` widget: a declared control that takes one of a list of values, as a native menu. */
export default class SelectWidget extends Component<ControlWidgetSignature> {
  @service declare audio: AudioService;

  get choices(): readonly (string | number)[] {
    const meta = this.args.control.meta;
    return meta.kind === 'choice' ? meta.choices : [];
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
    >
      {{#each this.choices as |choice|}}
        <option
          value={{text choice}}
          selected={{isChosen @control.value choice}}
        >{{choice}}</option>
      {{/each}}
    </select>
  </template>
}
