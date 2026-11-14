/**
 * The pointer and keyboard behaviour every continuous control shares (slider, knob): dragging with
 * pointer capture, fine adjustment, tap, double tap and long press, and the keys of an ARIA slider.
 * It works in positions (0..1 along the control's travel); the control turns positions into values
 * with its mapping (controls/modes.ts).
 */
import type { Mapping } from 'client-v2/controls/modes';

/** How much slower the control moves with Shift held. */
export const FINE = 0.1;
const LONG_PRESS_MS = 500;
const DOUBLE_TAP_MS = 350;
/** How far a finger may wander and still be a tap or a long press. */
const SLOP_PX = 8;

export interface GestureOptions {
  /** the control's position now */
  position(): number;
  /**
   * Where along the travel a pointer is, for a control you can press anywhere on (a slider). Leave it
   * out for one that only moves relatively (a knob).
   */
  positionAt?(event: PointerEvent): number;
  /**
   * The way the control travels. A finger that sets off across it instead (up or down over a horizontal
   * slider) is scrolling, or trying to: the control leaves that gesture alone. Leave out for a control
   * that takes movement either way (a knob).
   */
  axis?: () => 'x' | 'y';
  /** how far the pointer has moved along the control's axis since `from`, as a share of full travel */
  travel(event: PointerEvent, from: PointerEvent): number;
  onPosition(position: number): void;
  /** double click, or double tap */
  onReset?(): void;
  /** long press, or the context-menu button */
  onMenu?(): void;
}

/**
 * One control's gestures. Wire `down`, `move`, `up` and `cancel` to the element's pointer events (the
 * element must have `touch-action` set so that a drag along its axis is not taken for a scroll).
 */
export class ControlGesture {
  #options: GestureOptions;
  #pointer: number | null = null;
  #start: PointerEvent | null = null;
  #last: PointerEvent | null = null;
  #position = 0;
  #dragged = false;
  #pressTimer: ReturnType<typeof setTimeout> | undefined;
  #longPressed = false;
  #lastTap = 0;

  constructor(options: GestureOptions) {
    this.#options = options;
  }

  get active(): boolean {
    return this.#pointer !== null;
  }

  down = (event: PointerEvent): void => {
    if (event.button !== 0 || this.#pointer !== null) return;
    const element = event.currentTarget as Element;
    try {
      element.setPointerCapture(event.pointerId);
    } catch {
      // a pointer the browser is not tracking (a synthetic event): the drag still works while it stays
      // over the control
    }
    this.#pointer = event.pointerId;
    this.#start = this.#last = event;
    this.#position = this.#options.position();
    this.#dragged = false;
    this.#longPressed = false;
    clearTimeout(this.#pressTimer);
    if (this.#options.onMenu) {
      this.#pressTimer = setTimeout(() => {
        if (this.#pointer === null || this.#dragged) return;
        this.#longPressed = true;
        this.#options.onMenu?.();
      }, LONG_PRESS_MS);
    }
    // A mouse press on a slider goes there at once. A finger waits to see whether this is a tap, a
    // drag, a long press or the start of a scroll.
    if (
      event.pointerType === 'mouse' &&
      this.#options.positionAt &&
      !event.shiftKey
    ) {
      this.#set(this.#options.positionAt(event));
    }
  };

  move = (event: PointerEvent): void => {
    if (event.pointerId !== this.#pointer || !this.#start || !this.#last)
      return;
    if (this.#longPressed) return;
    if (!this.#dragged) {
      const dx = Math.abs(event.clientX - this.#start.clientX);
      const dy = Math.abs(event.clientY - this.#start.clientY);
      const far = Math.hypot(dx, dy) > SLOP_PX;
      if (!far && event.pointerType !== 'mouse') return;
      if (far && event.pointerType !== 'mouse') {
        const axis = this.#options.axis?.();
        if ((axis === 'x' && dy > dx) || (axis === 'y' && dx > dy)) {
          // across the control, not along it: not ours, whether or not anything scrolls
          this.#end();
          return;
        }
      }
      this.#dragged = this.#dragged || far;
      if (far) clearTimeout(this.#pressTimer);
    }
    if (this.#options.positionAt && !event.shiftKey) {
      this.#set(this.#options.positionAt(event));
    } else {
      const moved = this.#options.travel(event, this.#last);
      this.#set(this.#position + moved * (event.shiftKey ? FINE : 1));
    }
    this.#last = event;
  };

  up = (event: PointerEvent): void => {
    if (event.pointerId !== this.#pointer) return;
    const tapped = !this.#dragged && !this.#longPressed;
    this.#end();
    if (!tapped) return;
    const now = event.timeStamp;
    if (this.#options.onReset && now - this.#lastTap < DOUBLE_TAP_MS) {
      this.#lastTap = 0;
      this.#options.onReset();
      return;
    }
    this.#lastTap = now;
    // a finger's tap on a slider goes there (a mouse already did, on the way down)
    if (event.pointerType !== 'mouse' && this.#options.positionAt) {
      this.#set(this.#options.positionAt(event));
    }
  };

  /** The browser took the pointer for something else (a scroll): nothing more happens. */
  cancel = (event: PointerEvent): void => {
    if (event.pointerId === this.#pointer) this.#end();
  };

  /** The context-menu button (right click, or the keyboard's menu key). */
  contextMenu = (event: Event): void => {
    if (!this.#options.onMenu) return;
    event.preventDefault();
    this.#end();
    this.#options.onMenu();
  };

  #set(position: number): void {
    this.#position = Math.min(1, Math.max(0, position));
    this.#options.onPosition(this.#position);
  }

  #end(): void {
    clearTimeout(this.#pressTimer);
    this.#pointer = null;
    this.#start = this.#last = null;
  }
}

/**
 * The position an ARIA slider key moves to, or null for a key that is not one of them.
 * Arrows move one key step (a tenth of that with Shift, unless the mode moves in whole steps),
 * Page Up and Page Down ten, Home and End go to the ends.
 */
export function positionForKey(
  event: KeyboardEvent,
  position: number,
  mapping: Mapping,
): number | null {
  const discrete = mapping.mode === 'note' || mapping.mode === 'stepped';
  const step = mapping.keyStep * (event.shiftKey && !discrete ? FINE : 1);
  const page = Math.max(mapping.keyStep, Math.min(0.1, mapping.keyStep * 10));
  let next: number;
  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowUp':
      next = position + step;
      break;
    case 'ArrowLeft':
    case 'ArrowDown':
      next = position - step;
      break;
    case 'PageUp':
      next = position + page;
      break;
    case 'PageDown':
      next = position - page;
      break;
    case 'Home':
      next = 0;
      break;
    case 'End':
      next = 1;
      break;
    default:
      return null;
  }
  return Math.min(1, Math.max(0, next));
}
