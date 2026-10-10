import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class PresetMenuComponent extends Component {
  @tracked item;
  @tracked selectedPreset;
  // 'idle' -> 'selected' -> 'loading' -> 'success' | 'error' (re-selecting after an error retries)
  @tracked status = 'idle';

  get canSubmit() {
    return this.status === 'selected';
  }

  async submit() {
    this.status = 'loading';
    try {
      await this.args.onSubmit(this.selectedPreset.id);
      this.status = 'success';
      this.args.closeMenu();
    } catch (error) {
      console.error('Applying preset failed', error);
      this.status = 'error';
    }
  }

  @action
  selectItem(item) {
    if (this.status === 'loading') return;
    this.selectedPreset = item;
    this.status = 'selected';
  }

  @action
  async applyPreset() {
    if (!this.canSubmit) return;
    await this.submit();
  }
}
