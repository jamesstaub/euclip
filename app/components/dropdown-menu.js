import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { isPresent } from '@ember/utils';

export default class DropdownMenuComponent extends Component {
  @tracked open = false;
  @tracked menuX;
  @tracked menuY;

  offsetX = -70;
  offsetY = 32;

  @action
  addPositionClass(list) {
    const { x, y } = this.buttonElement.getClientRects()[0];
    this.menuX =
      x + (isPresent(this.args.offsetX) ? this.args.offsetX : this.offsetX);
    this.menuY =
      y + (isPresent(this.args.offsetY) ? this.args.offsetY : this.offsetY);

    list.style.top = `${this.menuY}px`;
    list.style.left = `${this.menuX}px`;
  }

  @action
  setPosition(button) {
    this.buttonElement = button;
  }

  @action
  toggleOpen(e) {
    e.stopPropagation();
    this.open = !this.open;
  }

  @action
  close() {
    this.open = false;
  }

  @action
  onSelectItem(itemAction) {
    this.open = false;
    itemAction();
  }
}
