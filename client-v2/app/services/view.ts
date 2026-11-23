import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';

/**
 * The footer's views of a track: its sound (the source's editor beside every node's controls, under the
 * step picker) and its steps (the sequence pane). An earlier version's 'source' and 'controls' are 'sound'.
 */
export type FooterPane = 'sound' | 'sequence';

/** In the order the footer's menu shows them. */
export const FOOTER_PANES: readonly FooterPane[] = ['sound', 'sequence'];

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
  laneView?: unknown;
  sheetOpen?: unknown;
  sheetSize?: unknown;
  selectedTrack?: unknown;
  welcomeSeen?: unknown;
  referenceOpen?: unknown;
}

/** How tall the phone's track sheet is when it is open: half the screen, or up to the project bar. */
export type SheetSize = 'half' | 'full';

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

  /**
   * Whether this is the phone layout (below 48rem wide): one track at a time, with a rail to choose it,
   * and the footer as a sheet. Follows the window; tests may set it.
   */
  @tracked phone = window.matchMedia(PHONE).matches;

  #phoneQuery = window.matchMedia(PHONE);
  #onPhone = (event: MediaQueryListEvent): void => {
    this.phone = event.matches;
  };

  constructor(owner?: ConstructorParameters<typeof Service>[0]) {
    super(owner);
    this.#phoneQuery.addEventListener('change', this.#onPhone);
  }

  /**
   * The id of the track the person last selected, or the project scope for the main output. Remembered,
   * so a reload comes back to it; a track that is gone falls back to the first (app-shell).
   */
  @tracked selectedTrack: string | undefined =
    typeof this.#stored.selectedTrack === 'string'
      ? this.#stored.selectedTrack
      : undefined;

  selectTrack(id: string): void {
    this.selectedTrack = id;
    this.#save();
  }

  /**
   * Whether the source's waveform editor fills the screen (Expand). Here, not in the editor, so it stays
   * expanded as the track rail beside it chooses another track. Not remembered.
   */
  @tracked sourceExpanded = false;

  /** Whether the welcome has been shown on this browser: once, never again. Remembered with the rest of the view. */
  @tracked welcomeSeen = this.#stored.welcomeSeen === true;

  markWelcomeSeen(): void {
    if (this.welcomeSeen) return;
    this.welcomeSeen = true;
    this.#save();
  }

  /** Whether the script reference sidebar is open, beside the app. Remembered with the rest of the view. */
  @tracked referenceOpen = this.#stored.referenceOpen === true;

  setReferenceOpen(open: boolean): void {
    if (this.referenceOpen === open) return;
    this.referenceOpen = open;
    this.#save();
  }

  /** How tall the sheet is when open (phone only). Remembered; nothing to undo. */
  @tracked sheetSize: SheetSize =
    this.#stored.sheetSize === 'full' ? 'full' : 'half';

  /** Whether the footer shows the selected track's script instead of its UI. Change it with `toggleScript`. */
  @tracked scriptOpen = this.#stored.scriptOpen === true;

  /** The pane the footer menu has chosen. Change it with `setFooterPane`. */
  @tracked footerPane: FooterPane =
    this.#stored.footerPane === 'source' ||
    this.#stored.footerPane === 'controls'
      ? 'sound'
      : FOOTER_PANES.includes(this.#stored.footerPane as FooterPane)
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
   * What every track's row shows where its step grid is: 'steps' or the signal 'chain' drawn from the
   * running script. One choice for all the rows, from the project bar; nothing to undo. Not remembered:
   * the app always opens on the steps (the owner's choice, 2026-11-20).
   */
  @tracked rowsView: 'steps' | 'chain' = 'steps';

  setRowsView(view: 'steps' | 'chain'): void {
    this.rowsView = view;
  }

  /**
   * Which lanes a track shows, by track, where the person has said: `open` (its lane button pressed)
   * and `closed` (Hide lane). Otherwise a control's lane is shown while some step holds a value of its
   * own. One choice for the processors' control rows and the sequence pane. (The source's controls show
   * theirs one at a time, over the source's editor: `sourceLane`.) Remembered; nothing to undo.
   */
  @tracked private laneView: Readonly<
    Record<string, { open: string[]; closed: string[] }>
  > =
    this.#stored.laneView &&
    typeof this.#stored.laneView === 'object' &&
    !Array.isArray(this.#stored.laneView)
      ? Object.fromEntries(
          Object.entries(this.#stored.laneView).flatMap(([scope, value]) => {
            const entry = value as { open?: unknown; closed?: unknown } | null;
            const strings = (list: unknown): string[] =>
              Array.isArray(list)
                ? list.filter((key): key is string => typeof key === 'string')
                : [];
            return entry && typeof entry === 'object'
              ? [
                  [
                    scope,
                    {
                      open: strings(entry.open),
                      closed: strings(entry.closed),
                    },
                  ],
                ]
              : [];
          }),
        )
      : {};

  /** Whether one lane of a track is shown (`active`: some step of it holds a value of its own). */
  isLaneShown(scopeId: string, key: string, active: boolean): boolean {
    const said = this.laneView[scopeId];
    if (said?.closed.includes(key)) return false;
    return active || (said?.open.includes(key) ?? false);
  }

  /** One grid or lane of a track shown or hidden, wherever it is drawn. */
  setLane(scopeId: string, key: string, on: boolean): void {
    const said = this.laneView[scopeId] ?? { open: [], closed: [] };
    const open = said.open.filter((k) => k !== key);
    const closed = said.closed.filter((k) => k !== key);
    this.laneView = {
      ...this.laneView,
      [scopeId]: on
        ? { open: [...open, key], closed }
        : { open, closed: [...closed, key] },
    };
    this.#save();
  }

  /**
   * The one lane shown over the source's editor, by track: a control's key (a sampler's speed, start,
   * end or loop point, or any other control of the source). Opened from the control's lane button, which
   * takes the place of another. Not remembered; nothing to undo.
   */
  @tracked private sourceLanes: Readonly<Record<string, string>> = {};

  sourceLane(scopeId: string): string | null {
    return this.sourceLanes[scopeId] ?? null;
  }

  /** Shows a control's lane over the source's editor (null: none; the one it was stays its aim). */
  setSourceLane(scopeId: string, key: string | null): void {
    const { [scopeId]: was, ...rest } = this.sourceLanes;
    if (key === null && was !== undefined) {
      this.sourceAims = { ...this.sourceAims, [scopeId]: was };
    }
    this.sourceLanes = key === null ? rest : { ...rest, [scopeId]: key };
  }

  /**
   * The source control last touched (or whose lane was last shown), by track: the lane the editor's one
   * lane button opens. Not remembered.
   */
  @tracked private sourceAims: Readonly<Record<string, string>> = {};

  /** The lane shown over the source, else the one its lane button would show (undefined: the editor's first). */
  sourceLaneAim(scopeId: string): string | undefined {
    return this.sourceLanes[scopeId] ?? this.sourceAims[scopeId];
  }

  /** A source control was touched: its lane is the aim, and is shown at once where a lane is open. */
  aimSourceLane(scopeId: string, key: string): void {
    if (this.sourceAims[scopeId] !== key) {
      this.sourceAims = { ...this.sourceAims, [scopeId]: key };
    }
    const open = this.sourceLanes[scopeId];
    if (open !== undefined && open !== key) this.setSourceLane(scopeId, key);
  }

  /** Which sequence the synth editor's step strip shows, by track, where the person has chosen. Not remembered. */
  @tracked private stepSequences: Readonly<Record<string, string>> = {};

  chosenStepSequence(scopeId: string): string | undefined {
    return this.stepSequences[scopeId];
  }

  chooseStepSequence(scopeId: string, name: string): void {
    this.stepSequences = { ...this.stepSequences, [scopeId]: name };
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

  /**
   * Whether the footer is open: on a phone (a bottom sheet) as it was left (closed to start with); on
   * larger screens open to start with, and not remembered.
   */
  @tracked private opened = this.phone ? this.#stored.sheetOpen === true : true;

  get footerOpen(): boolean {
    return this.opened;
  }

  set footerOpen(open: boolean) {
    if (this.opened === open) return;
    this.opened = open;
    this.#save();
  }

  /** What the sheet's handle does: closed opens to half, half goes to full, full back to half. */
  cycleSheet(): void {
    if (!this.footerOpen) {
      this.sheetSize = 'half';
      this.footerOpen = true;
    } else {
      this.sheetSize = this.sheetSize === 'half' ? 'full' : 'half';
    }
    this.#save();
  }

  /**
   * A tab of the phone's sheet: closed (or on the script), it opens to half on that tab; the tab already
   * showing closes the sheet; another tab is shown.
   */
  tapTab(pane: FooterPane): void {
    if (this.footerOpen && !this.scriptOpen && this.footerPane === pane) {
      this.footerOpen = false;
    } else {
      if (!this.footerOpen) this.sheetSize = 'half';
      this.scriptOpen = false;
      this.footerPane = pane;
      this.footerOpen = true;
    }
    this.#save();
  }

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
    if (this.phone && !this.footerOpen) this.sheetSize = 'full';
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
    this.#phoneQuery.removeEventListener('change', this.#onPhone);
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
      // (on a phone the script gets the room of the full sheet: it is code)
      if (this.phone) this.sheetSize = 'full';
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
    this.footerPane = 'sound';
    // (on the phone the sheet stays as it is: what it will show is ready when it is opened)
    if (!this.phone) this.footerOpen = true;
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
    this.footerPane = 'sound';
    if (!this.phone) this.footerOpen = true;
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
    if (this.phone && !this.footerOpen) this.sheetSize = 'half';
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
          laneView: this.laneView,
          sheetSize: this.sheetSize,
          selectedTrack: this.selectedTrack,
          welcomeSeen: this.welcomeSeen,
          referenceOpen: this.referenceOpen,
          // (only a phone remembers whether the footer was open: elsewhere it starts open)
          sheetOpen: this.phone ? this.opened : this.#stored.sheetOpen,
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
