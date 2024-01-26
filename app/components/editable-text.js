import { action } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

export default class EditableTextComponent extends Component {
  @tracked isEditing = false;

  @action
  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

  @action
  onKey(evt) {
    if (evt.key === 'Escape') {
      this.args.onCancel();
      this.toggleEdit();
    }
  }

  @action
  async save(e) {
    e.preventDefault();

    if (this.args.value.length < 2) return;

    try {
      await this.args.onSave();
      this.isEditing = false;
    } catch (error) {
      console.error(error);
    }
  }
}
