import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';

export type FooterPane = 'source' | 'controls' | 'sequence';

/** In the order the footer's menu shows them. */
export const FOOTER_PANES: readonly FooterPane[] = [
  'source',
  'controls',
  'sequence',
];

/** How long a section of the controls pane stays outlined after the signal chain sent the person to it. */
export const LOCATE_MS = 1800;

/** Where the view is remembered. It belongs to the person and the device, never to the project document. */
export const VIEW_STORAGE_KEY = 'euclip:view';

/** How long the control declared on the cursor's line stays marked after the script is closed. */
export const LINK_MS = 2400;

/** Below this width the footer is a bottom sheet and starts collapsed. Keep in step with track-footer.css. */
const PHONE = '(max-width: 47.99rem)';

interface Stored {
  waveforms?: unknown;
  scriptOpen?: unknown;
  footerPane?: unknown;
  collapsed?: unknown;
  snaps?: unknown;
  lanes?: unknown;
  rows?: unknown;
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
/** The sound browser's lists: the library, the person's own sounds, this project's. */
export type SoundsTab = 'library' | 'mine' | 'project';

export default class ViewService extends Service {
  #stored = readStored();

  /** Whether the footer shows the selected track's script instead of its UI. Change it with `toggleScript`. */
  @tracked scriptOpen = this.#stored.scriptOpen === true;

  /** The pane the footer menu has chosen. Change it with `setFooterPane`. */
  @tracked footerPane: FooterPane = FOOTER_PANES.includes(
    this.#stored.footerPane as FooterPane,
  )
    ? (this.#stored.footerPane as FooterPane)
    : 'sequence';

  /**
   * The sections of the controls pane the person has closed, as `scope/section` keys. Sections are open
   * unless they are listed here.
   */
  @tracked private collapsed: readonly string[] = Array.isArray(
    this.#stored.collapsed,
  )
    ? this.#stored.collapsed.filter(
        (key): key is string => typeof key === 'string',
      )
    : [];

  /**
   * Which waveform editor the source pane shows, for each scope whose script declares several: the
   * waveform's key. A scope not listed shows its first.
   */
  @tracked private waveforms: Readonly<Record<string, string>> =
    this.#stored.waveforms &&
    typeof this.#stored.waveforms === 'object' &&
    !Array.isArray(this.#stored.waveforms)
      ? Object.fromEntries(
          Object.entries(this.#stored.waveforms).filter(
            (entry): entry is [string, string] => typeof entry[1] === 'string',
          ),
        )
      : {};

  /** The waveform chosen for a scope, if one has been. It may no longer be in the script: the pane falls back. */
  chosenWaveform(scopeId: string): string | undefined {
    return this.waveforms[scopeId];
  }

  chooseWaveform(scopeId: string, key: string): void {
    if (this.waveforms[scopeId] === key) return;
    this.waveforms = { ...this.waveforms, [scopeId]: key };
    this.#save();
  }

  /**
   * What a waveform editor's handles snap to, where the person has said: by `scope/waveform`. One not
   * listed follows its sound (slices if it has them, else zero crossings). Remembered, like the rest
   * of how things are looked at; not the project's, and nothing to undo.
   */
  @tracked private snaps: Readonly<Record<string, string>> =
    this.#stored.snaps &&
    typeof this.#stored.snaps === 'object' &&
    !Array.isArray(this.#stored.snaps)
      ? Object.fromEntries(
          Object.entries(this.#stored.snaps).filter(
            (entry): entry is [string, string] => typeof entry[1] === 'string',
          ),
        )
      : {};

  chosenSnap(scopeId: string, waveform: string): string | undefined {
    return this.snaps[`${scopeId}/${waveform}`];
  }

  chooseSnap(scopeId: string, waveform: string, snap: string): void {
    this.snaps = { ...this.snaps, [`${scopeId}/${waveform}`]: snap };
    this.#save();
  }

  /**
   * The per-step lane a track's row shows (at most one), by track: a control's key, or '' for none.
   * One not listed has not been chosen: the row shows the first. Remembered; nothing to undo.
   */
  @tracked private lanes: Readonly<Record<string, string>> =
    this.#stored.lanes &&
    typeof this.#stored.lanes === 'object' &&
    !Array.isArray(this.#stored.lanes)
      ? Object.fromEntries(
          Object.entries(this.#stored.lanes).filter(
            (entry): entry is [string, string] => typeof entry[1] === 'string',
          ),
        )
      : {};

  /**
   * What a track's row shows where its step grid is: 'steps' (the default) or its 'chain', the signal
   * chain drawn from the running script. By track; remembered; nothing to undo.
   */
  @tracked private rows: Readonly<Record<string, string>> =
    this.#stored.rows &&
    typeof this.#stored.rows === 'object' &&
    !Array.isArray(this.#stored.rows)
      ? Object.fromEntries(
          Object.entries(this.#stored.rows).filter(
            (entry): entry is [string, string] => entry[1] === 'chain',
          ),
        )
      : {};

  rowView(scopeId: string): 'steps' | 'chain' {
    return this.rows[scopeId] === 'chain' ? 'chain' : 'steps';
  }

  setRowView(scopeId: string, view: 'steps' | 'chain'): void {
    if (this.rowView(scopeId) === view) return;
    const { [scopeId]: _gone, ...rest } = this.rows;
    void _gone;
    this.rows = view === 'chain' ? { ...rest, [scopeId]: 'chain' } : rest;
    this.#save();
  }

  chosenLane(scopeId: string): string | undefined {
    return this.lanes[scopeId];
  }

  chooseLane(scopeId: string, key: string | null): void {
    if (this.lanes[scopeId] === (key ?? '')) return;
    this.lanes = { ...this.lanes, [scopeId]: key ?? '' };
    this.#save();
  }

  // --- the sound browser --------------------------------------------------------------------------

  /** Which of the browser's three lists is showing. */
  @tracked soundsTab: SoundsTab = 'library';

  /**
   * The sampler Use gives a sound to, when the person has said (Browse… from a sampler's own picker,
   * or the browser's choice among a track's samplers); otherwise the selected track's first.
   */
  @tracked soundTarget: { scopeId: string; key: string } | null = null;

  /** Opens the sidebar: set by the app shell, which owns whether it is open. */
  openSounds: (() => void) | null = null;

  /** Browse… from a sampler's picker: the library, aimed at that sampler. */
  browseSounds(scopeId: string, key: string): void {
    this.soundTarget = { scopeId, key };
    this.soundsTab = 'library';
    this.openSounds?.();
  }

  /** Collapsed to its bar on phones (a bottom sheet) to start with; otherwise open. */
  @tracked footerOpen = !window.matchMedia(PHONE).matches;

  // --- code and controls, linked -----------------------------------------------------------------

  /**
   * A line of a scope's script the editor is asked to show (a control's "show in script"). The token
   * is new each time, so asking for the same line twice shows it twice.
   */
  @tracked reveal: { scopeId: string; line: number; token: number } | null =
    null;

  /**
   * The line the cursor was on in a scope's script when the footer last turned from the script back to
   * its UI: the control declared on that line is marked for a moment.
   */
  @tracked linked: { scopeId: string; line: number } | null = null;

  #cursor: { scopeId: string; line: number } | null = null;
  #linkTimer: ReturnType<typeof setTimeout> | undefined;
  #token = 0;

  /** Turns the footer to the script and shows a line of it. */
  showInScript(scopeId: string, line: number): void {
    this.reveal = { scopeId, line, token: ++this.#token };
    this.scriptOpen = true;
    this.footerOpen = true;
    this.#cursor = { scopeId, line };
    this.#save();
  }

  /** The editor says where the person's cursor is. Not tracked: nothing is drawn from it until the UI returns. */
  noteCursor(scopeId: string, line: number): void {
    this.#cursor = { scopeId, line };
  }

  willDestroy(): void {
    super.willDestroy();
    clearTimeout(this.#linkTimer);
    clearTimeout(this.#locateTimer);
  }

  /**
   * The script button. Pressed while the footer is collapsed, it opens the footer on the script, since
   * turning the script on (or off) where it cannot be seen would look like nothing happened.
   */
  toggleScript(): void {
    if (this.footerOpen) {
      this.scriptOpen = !this.scriptOpen;
      if (!this.scriptOpen && this.#cursor) {
        // back to the UI: the control declared where the cursor was is pointed out, briefly
        this.linked = this.#cursor;
        clearTimeout(this.#linkTimer);
        this.#linkTimer = setTimeout(() => (this.linked = null), LINK_MS);
      }
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

  /**
   * The section of the controls pane the signal chain has sent the person to: it is scrolled to and
   * outlined for a moment. The token is new each time, so asking for the same node twice shows it twice.
   */
  @tracked located: { scopeId: string; section: string; token: number } | null =
    null;
  #locateTimer: ReturnType<typeof setTimeout> | undefined;

  /** A node of the signal chain was opened: its controls, scrolled to and outlined. */
  showControlsOf(scopeId: string, nodeId: string): void {
    this.footerPane = 'controls';
    this.footerOpen = true;
    this.scriptOpen = false;
    // (a closed section would hide what is being pointed at)
    this.setSectionOpen(scopeId, nodeId, true);
    this.located = { scopeId, section: nodeId, token: ++this.#token };
    clearTimeout(this.#locateTimer);
    this.#locateTimer = setTimeout(() => (this.located = null), LOCATE_MS);
    this.#save();
  }

  /** A sampler of the signal chain was opened: its waveform, chosen in the source pane. */
  showSourceOf(scopeId: string, waveformKey: string | null): void {
    if (waveformKey !== null) this.chooseWaveform(scopeId, waveformKey);
    this.footerPane = 'source';
    this.footerOpen = true;
    this.scriptOpen = false;
    this.#save();
  }

  /** Whether a section of a scope's controls pane is open. */
  isSectionOpen(scopeId: string, section: string): boolean {
    return !this.collapsed.includes(`${scopeId}/${section}`);
  }

  setSectionOpen(scopeId: string, section: string, open: boolean): void {
    const key = `${scopeId}/${section}`;
    if (open === !this.collapsed.includes(key)) return;
    this.collapsed = open
      ? this.collapsed.filter((candidate) => candidate !== key)
      : [...this.collapsed, key];
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
          collapsed: this.collapsed,
          waveforms: this.waveforms,
          snaps: this.snaps,
          lanes: this.lanes,
          rows: this.rows,
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
