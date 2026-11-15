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
/** A mouse is steadier: any real movement is a drag (and so never half of a double click). */
const MOUSE_SLOP_PX = 2;

export interface GestureOptions {
  /** the control's position now */
  position(): number;
  /**
   * Where along the travel a pointer is, for a control you can press anywhere on (a slider). Leave it
   * out for one that only moves relatively (a knob). The pointer may be anywhere on the page: a
   * position before the start or past the end is held at the ends.
   */
  positionAt?(event: PointerEvent, element: Element): number;
  /**
   * The way the control travels. A finger that sets off across it instead (up or down over a horizontal
   * slider) is scrolling, or trying to: the control leaves that gesture alone. Leave out for a control
   * that takes movement either way (a knob).
   */
  axis?: () => 'x' | 'y';
  /** how far the pointer has moved along the control's axis since `from`, as a share of full travel */
  travel(event: PointerEvent, from: PointerEvent, element: Element): number;
  onPosition(position: number): void;
  /** double click, or double tap */
  onReset?(): void;
  /** long press with a finger or pen, or the context-menu button */
  onMenu?(): void;
}

/**
 * One control's gestures. Wire `down` to the element's `pointerdown` and `contextMenu` to its
 * `contextmenu`; that is all (the element must have `touch-action` set so that a drag along its axis is
 * not taken for a scroll).
 *
 * From the press to the release the gesture behaves like a native slider's: the pointer is captured, so
 * the control keeps following it wherever it goes, off the control and off the window, held at the ends
 * of its range; and it lets go on release anywhere. Besides capture, the rest of the gesture is listened
 * for on the window, and only while a press is down, so that nothing depends on the events arriving at
 * the element: a release the element never hears of (capture refused or lost, the window losing focus,
 * the page being hidden, the browser cancelling the pointer, a second finger arriving) still ends it.
 * A gesture can therefore not be left "stuck" following a pointer that is no longer down.
 */
export class ControlGesture {
  #options: GestureOptions;
  #pointer: number | null = null;
  #element: Element | null = null;
  #start: PointerEvent | null = null;
  #last: PointerEvent | null = null;
  #position = 0;
  #dragged = false;
  #pressTimer: ReturnType<typeof setTimeout> | undefined;
  #longPressed = false;
  #lastTap = 0;
  /** takes this press's listeners off again */
  #stopListening: (() => void) | null = null;

  constructor(options: GestureOptions) {
    this.#options = options;
  }

  get active(): boolean {
    return this.#pointer !== null;
  }

  down = (event: PointerEvent): void => {
    if (this.#pointer !== null) {
      // a second finger on the control while one is dragging it: let go, rather than fight over it
      if (event.pointerId !== this.#pointer) this.#end();
      return;
    }
    if (event.button !== 0) return;
    const element = event.currentTarget as Element;
    try {
      element.setPointerCapture(event.pointerId);
    } catch {
      // a pointer the browser is not tracking (a synthetic event). The window's listeners still follow it.
    }
    this.#pointer = event.pointerId;
    this.#element = element;
    this.#start = this.#last = event;
    this.#position = this.#options.position();
    this.#dragged = false;
    this.#longPressed = false;
    this.#listen(element);
    clearTimeout(this.#pressTimer);
    // (a mouse has a button for the menu; holding it still on a handle before moving is not a request)
    if (this.#options.onMenu && event.pointerType !== 'mouse') {
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
      this.#set(this.#options.positionAt(event, element));
    }
  };

  move = (event: PointerEvent): void => {
    const element = this.#element;
    if (
      event.pointerId !== this.#pointer ||
      !this.#start ||
      !this.#last ||
      !element
    )
      return;
    // a mouse that moves with no button down was released where nothing heard it
    if (event.pointerType === 'mouse' && event.buttons === 0) {
      this.#end();
      return;
    }
    if (this.#longPressed) return;
    if (!this.#dragged) {
      const dx = Math.abs(event.clientX - this.#start.clientX);
      const dy = Math.abs(event.clientY - this.#start.clientY);
      const mouse = event.pointerType === 'mouse';
      const far = Math.hypot(dx, dy) > (mouse ? MOUSE_SLOP_PX : SLOP_PX);
      if (!far && !mouse) return;
      if (far && !mouse) {
        const axis = this.#options.axis?.();
        if ((axis === 'x' && dy > dx) || (axis === 'y' && dx > dy)) {
          // across the control, not along it: not ours, whether or not anything scrolls
          this.#end();
          return;
        }
      }
      this.#dragged = far;
      if (far) clearTimeout(this.#pressTimer);
    }
    if (this.#options.positionAt && !event.shiftKey) {
      this.#set(this.#options.positionAt(event, element));
    } else {
      const moved = this.#options.travel(event, this.#last, element);
      this.#set(this.#position + moved * (event.shiftKey ? FINE : 1));
    }
    this.#last = event;
  };

  up = (event: PointerEvent): void => {
    const element = this.#element;
    if (event.pointerId !== this.#pointer || !element) return;
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
      this.#set(this.#options.positionAt(event, element));
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

  /** Lets go of whatever is held. For the control's owner, when the control goes away. */
  release = (): void => this.#end();

  #set(position: number): void {
    this.#position = Math.min(1, Math.max(0, position));
    this.#options.onPosition(this.#position);
  }

  /** Everything a press needs to hear until it ends, wherever the pointer goes. */
  #listen(element: Element): void {
    this.#stopListening?.();
    const abort = new AbortController();
    const signal = abort.signal;
    const end = (): void => this.#end();
    const view = element.ownerDocument.defaultView ?? window;
    // (bubbling: with capture these arrive by way of the element, without it from wherever the pointer is)
    view.addEventListener('pointermove', this.move, { signal });
    view.addEventListener('pointerup', this.up, { signal });
    view.addEventListener('pointercancel', this.cancel, { signal });
    // another pointer going down anywhere (a second finger): this drag is over
    view.addEventListener(
      'pointerdown',
      (event) => {
        if (event.pointerId !== this.#pointer) end();
      },
      { signal, capture: true },
    );
    view.addEventListener('blur', end, { signal });
    element.ownerDocument.addEventListener(
      'visibilitychange',
      () => {
        if (element.ownerDocument.hidden) end();
      },
      { signal },
    );
    // capture gone without a release (the browser took it away): nothing more will come by the element
    element.addEventListener(
      'lostpointercapture',
      (event) => {
        if ((event as PointerEvent).pointerId === this.#pointer) end();
      },
      { signal },
    );
    this.#stopListening = () => abort.abort();
  }

  #end(): void {
    clearTimeout(this.#pressTimer);
    const element = this.#element;
    const pointer = this.#pointer;
    this.#pointer = null;
    this.#element = null;
    this.#start = this.#last = null;
    this.#stopListening?.();
    this.#stopListening = null;
    if (element && pointer !== null) {
      try {
        if (element.hasPointerCapture(pointer)) {
          element.releasePointerCapture(pointer);
        }
      } catch {
        // (never captured)
      }
    }
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
  const step =
    mapping.keyStep * (event.shiftKey && !mapping.discrete ? FINE : 1);
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
