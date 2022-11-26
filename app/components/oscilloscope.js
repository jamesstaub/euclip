import Component from '@glimmer/component';
import Nexus from 'nexusui';
import { action } from '@ember/object';

export default class OscilloscopeComponent extends Component {
  colorize() {
    this.oscilloscope.colorize('fill', '#333');
    this.oscilloscope.colorize('accent', '#52ebff');
  }

  @action
  updateNode() {
    if (this.oscilloscope) {
      this.oscilloscope.destroy();
    }
    this.oscilloscope = new Nexus.Oscilloscope(`#${this.args.id}`, {
      size: [515, 40],
    });
    this.colorize();
    this.oscilloscope.connect(this.args.node);
  }
}
