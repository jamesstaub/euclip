import Component from '@glimmer/component';

interface UiChipSignature {
  Args: {
    pressed?: boolean;
    on?: 'dark' | 'yellow';
    /** an empty slot reads quieter */
    quiet?: boolean;
  };
  Blocks: { default: [] };
  Element: HTMLButtonElement;
}

/** A small toggle that stands for one thing among several (a sampler of the track): pressed ones are outlined in yellow. */
export default class UiChipComponent extends Component<UiChipSignature> {
  get classes(): string {
    const yellow = this.args.on === 'yellow';
    const look = this.args.pressed
      ? yellow ? 'bw1 b--near-black near-black bg-white' : 'bw1 b--yellow yellow bg-yellow-15'
      : yellow
        ? `b--black-30 ${this.args.quiet ? 'mid-gray' : 'dark-gray'}`
        : `b--white-30 ${this.args.quiet ? 'moon-gray' : 'light-gray'}`;
    return `ba br2 pa1 f7 tl w-100 min-w-0 pointer bg-transparent ${look}`;
  }
}
