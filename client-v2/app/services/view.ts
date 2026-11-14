import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';

export type FooterPane = 'sequence' | 'source' | 'controls';

export const FOOTER_PANES: readonly FooterPane[] = [
  'sequence',
  'source',
  'controls',
];

/** Where the view is remembered. It belongs to the person and the device, never to the project document. */
export const VIEW_STORAGE_KEY = 'euclip:view';

/** Below this width the footer is a bottom sheet and starts collapsed. Keep in step with track-footer.css. */
const PHONE = '(max-width: 47.99rem)';

interface Stored {
  scriptOpen?: unknown;
  footerPane?: unknown;
}

function readStored(): Stored {
  try {
    const raw = window.localStorage.getItem(VIEW_STORAGE_KEY);
    const value: unknown = raw ? JSON.parse(raw) : null;
    return value && typeof value === 'object' ? value : {};
  } catch {
    // no storage (private mode, blocked, bad JSON): the defaults apply
    return {};
  }
}

/**
 * How the footer is being looked at: its UI or the selected track's script, which pane of the UI, and
 * whether it is open. Tracked; the script choice and the pane are remembered in localStorage.
 *
 * A script is shown in one place only: the footer, in place of its UI, when `scriptOpen` is on.
 */
export default class ViewService extends Service {
  #stored = readStored();

  /** Whether the footer shows the selected track's script instead of its UI. Change it with `toggleScript`. */
  @tracked scriptOpen = this.#stored.scriptOpen === true;

  /** The pane the footer menu has chosen. Change it with `setFooterPane`. */
  @tracked footerPane: FooterPane = FOOTER_PANES.includes(
    this.#stored.footerPane as FooterPane,
  )
    ? (this.#stored.footerPane as FooterPane)
    : 'controls';

  /** Collapsed to its bar on phones (a bottom sheet) to start with; otherwise open. */
  @tracked footerOpen = !window.matchMedia(PHONE).matches;

  /**
   * The script button. Pressed while the footer is collapsed, it opens the footer on the script, since
   * turning the script on (or off) where it cannot be seen would look like nothing happened.
   */
  toggleScript(): void {
    if (this.footerOpen) {
      this.scriptOpen = !this.scriptOpen;
    } else {
      this.scriptOpen = true;
      this.footerOpen = true;
    }
    this.#save();
  }

  setFooterPane(pane: FooterPane): void {
    this.footerPane = pane;
    this.#save();
  }

  toggleFooter(): void {
    this.footerOpen = !this.footerOpen;
  }

  #save(): void {
    try {
      window.localStorage.setItem(
        VIEW_STORAGE_KEY,
        JSON.stringify({
          scriptOpen: this.scriptOpen,
          footerPane: this.footerPane,
        }),
      );
    } catch {
      // not remembered this time; the view still works
    }
  }
}

declare module '@ember/service' {
  interface Registry {
    view: ViewService;
  }
}
