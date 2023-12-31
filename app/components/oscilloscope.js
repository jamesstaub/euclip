import Component from '@glimmer/component';
import Nexus from 'nexusui';
import { action } from '@ember/object';

export default class OscilloscopeComponent extends Component {
  colorize(fill = '#333', accent = '#52ebff') {
    this.oscilloscope.colorize('fill', fill);
    this.oscilloscope.colorize('accent', accent);
  }

  @action
  updateNode() {
    if (this.oscilloscope) {
      this.oscilloscope.destroy();
    }
    this.oscilloscope = new Nexus.Oscilloscope(`#${this.args.id}`, {
      size: [515, 40],
    });

    this.args.fill && this.oscilloscope.colorize('fill', this.args.fill);
    this.args.accent && this.oscilloscope.colorize('accent', this.args.accent);
    this.oscilloscope.connect(this.args.node);
  }
}
