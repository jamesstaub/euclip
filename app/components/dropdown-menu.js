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
    list.style.top = `${this.menuY}px`;
    list.style.left = `${this.menuX}px`;
  }

  @action
  setPosition(btn) {
    const {x, y} = btn.getClientRects()[0];
    this.menuX = x + this.offsetX;
    this.menuY = y + this.offsetY;
  }

  @action
  toggleOpen() {   
    this.open = !this.open;
  }
}
