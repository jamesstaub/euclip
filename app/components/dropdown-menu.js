import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class DropdownMenuComponent extends Component {
  @tracked open = false;
  @tracked menuX;
  @tracked menuY;

  offsetX = -80;
  offsetY = 35;
  
  @action
  addPositionClass(list) {
    const {x, y} = this.buttonElement.getClientRects()[0];
    this.menuX = x + this.offsetX;
    this.menuY = y + this.offsetY;

    list.style.top = `${this.menuY}px`;
    list.style.left = `${this.menuX}px`;
  }

  @action
  setPosition(button) {
    this.buttonElement = button;
  }

  @action
  toggleOpen() {   
    this.open = !this.open;
  }
}
