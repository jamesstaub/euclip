import Component from '@glimmer/component';

interface UiBadgeSignature {
  Args: {
    /** accent: yellow (where a sound already lives); muted: quiet information */
    tone?: 'accent' | 'muted';
    on?: 'dark' | 'yellow';
  };
  Blocks: { default: [] };
  Element: HTMLSpanElement;
}

const LOOK = {
  dark: { accent: 'yellow b--yellow', muted: 'moon-gray b--white-30' },
  yellow: { accent: 'dark-gray b--dark-gray', muted: 'dark-gray b--black-30' },
} as const;

export default class UiBadgeComponent extends Component<UiBadgeSignature> {
  get classes(): string {
    return `f7 ph2 br-pill ba nowrap truncate mw4 ${LOOK[this.args.on ?? 'dark'][this.args.tone ?? 'accent']}`;
  }
}
