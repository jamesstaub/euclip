import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { htmlSafe } from '@ember/template';
import { registerDestructor } from '@ember/destroyable';

interface SidebarWrapperSignature {
  Args: {
    direction: 'left' | 'right';
    title: string;
    onCloseSidebar?: () => void;
  };
  Blocks: {
    default: [];
    info: [];
  };
}

const MIN_WIDTH = 288;
const DEFAULT_WIDTH = 448;
const MAX_WIDTH = 960;
const MIN_MAIN_WIDTH = 384; // the track area must stay usable next to open sidebars
const KEY_STEP = 24;
const KEY_STEP_LARGE = 96;

/**
 * A resizable side panel for the project workspace grid (see styles/sidebars.css).
 *
 * The component owns its width. In the desktop layout it publishes that width to the
 * workspace as `--left-w` / `--right-w`, which the grid uses for its column tracks (and clamps so
 * the track area keeps its minimum width). In the drawer / full-screen layouts the CSS ignores the
 * handle and sizes the panel itself.
 */
export default class SidebarWrapperComponent extends Component<SidebarWrapperSignature> {
  @tracked width = DEFAULT_WIDTH;
  @tracked dragging = false;

  root: HTMLElement | null = null;
  // kept separately: by the time destructors run the aside is detached, so root.parentElement is null
  private workspaceEl: HTMLElement | null = null;
  private drag: { startX: number; startWidth: number } | null = null;

  constructor(owner: unknown, args: SidebarWrapperSignature['Args']) {
    super(owner, args);
    this.width = this.storedWidth() ?? DEFAULT_WIDTH;
    registerDestructor(this, () => {
      this.workspaceEl?.style.setProperty(this.widthVar, '0px');
      this.workspaceEl?.removeAttribute('data-resizing');
    });
  }

  get isLeft() {
    return this.args.direction === 'left';
  }

  get widthVar() {
    return this.isLeft ? '--left-w' : '--right-w';
  }

  get workspace(): HTMLElement | null {
    return this.workspaceEl ?? this.root?.parentElement ?? null;
  }

  get style() {
    return htmlSafe(`--sidebar-w: ${Math.round(this.width)}px`);
  }

  get min() {
    return MIN_WIDTH;
  }

  get max() {
    return Math.round(this.maxWidth());
  }

  get label() {
    return `Resize ${this.args.direction} sidebar`;
  }

  /** the widest this panel may get without squeezing the track area or the other sidebar */
  private maxWidth() {
    const workspace = this.workspace;
    if (!workspace) return MAX_WIDTH;
    let others = 0;
    workspace.querySelectorAll<HTMLElement>(':scope > .sidebar').forEach((el) => {
      if (el !== this.root) others += el.offsetWidth;
    });
    const room = workspace.clientWidth - others - MIN_MAIN_WIDTH;
    return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, room));
  }

  private clamp(px: number) {
    return Math.min(this.maxWidth(), Math.max(MIN_WIDTH, px));
  }

  private get storageKey() {
    return `euclip:sidebar-width:${this.args.direction}`;
  }

  private storedWidth(): number | null {
    try {
      const value = Number(localStorage.getItem(this.storageKey));
      return Number.isFinite(value) && value >= MIN_WIDTH ? value : null;
    } catch {
      return null; // storage can be unavailable (private windows); the default is fine
    }
  }

  private persist() {
    try {
      localStorage.setItem(this.storageKey, String(Math.round(this.width)));
    } catch {
      /* ignore */
    }
  }

  private setWidth(px: number) {
    this.width = this.clamp(px);
    this.publish();
  }

  private publish() {
    this.workspace?.style.setProperty(this.widthVar, `${Math.round(this.width)}px`);
  }

  @action
  setup(element: HTMLElement) {
    this.root = element;
    this.workspaceEl = element.parentElement;
    this.publish();
  }

  @action
  startResize(event: PointerEvent) {
    if (event.button !== 0) return;
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.drag = { startX: event.clientX, startWidth: this.root?.offsetWidth ?? this.width };
    this.dragging = true;
    this.workspace?.setAttribute('data-resizing', '');
  }

  @action
  onMove(event: PointerEvent) {
    if (!this.drag) return;
    const delta = (event.clientX - this.drag.startX) * (this.isLeft ? 1 : -1);
    this.setWidth(this.drag.startWidth + delta);
  }

  @action
  endResize(event: PointerEvent) {
    if (!this.drag) return;
    this.drag = null;
    this.dragging = false;
    this.workspace?.removeAttribute('data-resizing');
    const handle = event.currentTarget as HTMLElement;
    if (handle.hasPointerCapture?.(event.pointerId)) handle.releasePointerCapture(event.pointerId);
    this.persist();
  }

  @action
  onKey(event: KeyboardEvent) {
    const step = event.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
    const grow = this.isLeft ? 'ArrowRight' : 'ArrowLeft';
    const shrink = this.isLeft ? 'ArrowLeft' : 'ArrowRight';
    const current = this.root?.offsetWidth ?? this.width;
    let next: number | null = null;

    if (event.key === grow) next = current + step;
    else if (event.key === shrink) next = current - step;
    else if (event.key === 'Home') next = MIN_WIDTH;
    else if (event.key === 'End') next = this.maxWidth();
    else if (event.key === 'Enter') next = DEFAULT_WIDTH;
    if (next === null) return;

    event.preventDefault();
    event.stopPropagation(); // Escape / arrows are also global shortcuts elsewhere
    this.setWidth(next);
    this.persist();
  }

  @action
  resetWidth() {
    this.setWidth(DEFAULT_WIDTH);
    this.persist();
  }
}
