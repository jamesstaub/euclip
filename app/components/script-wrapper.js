import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
export default class ScriptWrapperComponent extends Component {
  @tracked scriptUi;
  
  constructor() {
    super(...arguments);
    this.scriptUi = 'init';
  }

  @action
  setUi(val) {
    this.scriptUi = val;
  }
}
