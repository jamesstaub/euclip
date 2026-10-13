import Component from '@glimmer/component';

interface UiButtonSignature {
  Args: {
    /** outline: the default action (dark, yellow outline); solid: the one that matters most (yellow fill); ghost: text only */
    variant?: 'outline' | 'solid' | 'ghost';
    /** the surface it sits on: dark panels (default) or the yellow footer */
    on?: 'dark' | 'yellow';
    size?: 's' | 'm';
    block?: boolean;
    /** a toggle: draws as solid while pressed and sets aria-pressed */
    pressed?: boolean;
    /** a ghost button that is not the chosen one (its label is quiet instead of accent coloured) */
    muted?: boolean;
  };
  Blocks: { default: [] };
  Element: HTMLButtonElement;
}

// Tachyons classes only. Every button in the app is one of: variant x surface x size.
const LOOK = {
  dark: {
    outline: 'b--yellow yellow bg-dark-gray',
    solid: 'b--yellow bg-yellow near-black',
    ghost: 'b--transparent bg-transparent yellow',
  },
  yellow: {
    outline: 'b--dark-gray dark-gray bg-transparent',
    solid: 'b--dark-gray bg-dark-gray yellow',
    ghost: 'b--transparent bg-transparent dark-gray',
  },
} as const;

export default class UiButtonComponent extends Component<UiButtonSignature> {
  get classes(): string {
    const on = this.args.on ?? 'dark';
    const variant = this.args.pressed ? 'solid' : (this.args.variant ?? 'outline');
    const size = this.args.size === 's' ? 'pv1 ph2 f7' : 'pv2 ph3 f6 ttu';
    // a quiet ghost swaps its accent colour for a muted one (both are tachyons colours, so it is one class, not two)
    const look = variant === 'ghost' && this.args.muted ? `b--transparent bg-transparent ${on === 'yellow' ? 'dark-gray' : 'moon-gray'}` : LOOK[on][variant];
    // a pressed toggle does not fade on hover: it is the chosen one
    const hover = this.args.pressed ? '' : 'dim';
    return `fw6 ba bw1 pointer tc ${hover} ${size} ${look} ${this.args.block ? 'w-100' : ''}`;
  }

  get pressedAttr(): string | undefined {
    return this.args.pressed === undefined ? undefined : this.args.pressed ? 'true' : 'false';
  }
}
