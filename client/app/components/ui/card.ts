import Component from '@glimmer/component';

interface UiCardSignature {
  Args: {
    /** what the card sits on */
    on?: 'dark' | 'yellow' | 'panel';
    /** selected: the chosen one; empty: nothing in it yet (dashed); target: where the next thing will go */
    state?: 'selected' | 'empty' | 'target';
  };
  Blocks: { default: [] };
  Element: HTMLElement;
}

const BASE = {
  dark: 'b--yellow bg-black-20 light-gray',
  yellow: 'b--dark-gray bg-white-50 near-black',
  // a dark-gray panel on the yellow footer (a sound with its waveform): near-white text, blue accents
  panel: 'b--near-black bg-dark-gray near-white',
} as const;

export default class UiCardComponent extends Component<UiCardSignature> {
  get classes(): string {
    const on = this.args.on ?? 'dark';
    const state = this.args.state;
    const extra =
      state === 'selected' ? (on === 'yellow' ? 'bg-white bw1 b--near-black' : on === 'panel' ? 'bw1 b--light-blue' : 'bg-yellow-15') :
      state === 'empty' ? 'b--dashed bg-transparent' :
      state === 'target' ? (on === 'panel' ? 'b--light-blue ring-light-blue' : 'b--near-black bg-light-blue-25 ring-light-blue') : '';
    return `relative br3 ba bw1 pa2 min-w-0 ${BASE[on]} ${extra}`;
  }
}
