import { modifier } from 'ember-modifier';

const FOCUSABLE =
  'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

export interface DialogFocusSignature {
  Element: HTMLElement;
  Args: {
    Named: {
      onClose: () => void;
      /** where focus goes back to when the dialog goes, if it is still on the page; else where it was */
      returnTo?: HTMLElement | null;
    };
  };
}

function tabbable(element: HTMLElement): HTMLElement[] {
  return [...element.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (item) => item.getClientRects().length > 0,
  );
}

/**
 * Focus for a dialog (or the tour's card): on arrival it goes to the element marked `data-autofocus`,
 * else the first thing that can take it; Tab and Shift+Tab stay inside; Escape closes (before anything
 * else that listens for it); when it goes, focus goes back to where it came from.
 */
export default modifier<DialogFocusSignature>(
  (element, _positional, { onClose, returnTo }) => {
    const before = document.activeElement as HTMLElement | null;
    const first =
      element.querySelector<HTMLElement>('[data-autofocus]') ??
      tabbable(element)[0] ??
      element;
    first.focus();

    const onKeydown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = tabbable(element);
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const active = document.activeElement;
      const at = active instanceof HTMLElement ? items.indexOf(active) : -1;
      if (at === -1) {
        event.preventDefault();
        (event.shiftKey ? items.at(-1)! : items[0]!).focus();
      } else if (event.shiftKey && at === 0) {
        event.preventDefault();
        items.at(-1)!.focus();
      } else if (!event.shiftKey && at === items.length - 1) {
        event.preventDefault();
        items[0]!.focus();
      }
    };
    document.addEventListener('keydown', onKeydown, true);
    return () => {
      document.removeEventListener('keydown', onKeydown, true);
      const back = returnTo?.isConnected ? returnTo : before;
      if (back?.isConnected) back.focus();
    };
  },
);
