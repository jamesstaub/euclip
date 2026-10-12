import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { MACRO_EXAMPLES } from 'euclip/utils/macros/library';
import { resolveSpec } from 'euclip/utils/macros/schema';

/**
 * The Macros menu: the built-in macros (the same list in every project; later users will be able to
 * save and share their own). Choosing one loads a documented example, with its control schema
 * declaration, into the track's setup and play scripts.
 */
export default class MacroMenuComponent extends Component {
  macros = MACRO_EXAMPLES;

  @tracked selected = MACRO_EXAMPLES[0];
  @tracked isLoading = false;
  @tracked failed = false;

  // a short summary of the selected macro's settings: name, what it is, its range
  get settings() {
    return Object.entries(this.selected.schema).map(([key, spec]) => {
      const { min, max, unit } = resolveSpec(spec);
      return {
        key,
        label: spec.label ?? key,
        range: spec.type === 'choice' ? spec.choices.join(' | ') : `${min} – ${max} ${unit}`,
      };
    });
  }

  @action
  select(macro) {
    if (this.isLoading) return;
    this.selected = macro;
    this.failed = false;
  }

  @action
  async load() {
    this.isLoading = true;
    this.failed = false;
    try {
      await this.args.onSubmit(this.selected.key);
      this.args.closeMenu();
    } catch (error) {
      console.error('Loading macro example failed', error);
      this.failed = true;
    } finally {
      this.isLoading = false;
    }
  }
}
