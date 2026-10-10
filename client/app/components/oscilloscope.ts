import Component from '@glimmer/component';
import Nexus from 'nexusui';
import { action } from '@ember/object';
import { service } from '@ember/service';
import MediaService from 'ember-responsive';

interface OscilloscopeComponentArgs {
  id: string;
  node: AudioNode;
  fill?: string;
  accent?: string;
}

export default class OscilloscopeComponent extends Component<OscilloscopeComponentArgs> {
  @service declare media: MediaService;

  private oscilloscope?: Nexus.Oscilloscope;

  private colorize(fill: string = '#333', accent: string = '#52ebff') {
    this.oscilloscope?.colorize('fill', fill);
    this.oscilloscope?.colorize('accent', accent);
  }

  @action
  updateNode(): void {
    if (this.oscilloscope) {
      this.oscilloscope.destroy();
    }
    let size = [515, 40];
    this.oscilloscope = new Nexus.Oscilloscope(`#${this.args.id}`, {
      size
    });

    this.colorize(this.args.fill, this.args.accent);
    this.oscilloscope.connect(this.args.node);
  }
}
