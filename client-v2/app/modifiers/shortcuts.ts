import { modifier } from 'ember-modifier';

export interface ShortcutsSignature {
  Element: HTMLElement;
  Args: {
    Named: {
      /** Space, when focus is not in something that uses the key itself */
      onSpace: () => void;
      onUndo: () => void;
      onRedo: () => void;
    };
  };
}

/** Whether the key belongs to what has focus: a text field, a code editor, a button, a control, a menu. */
function usesKeys(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.closest(
      'input, textarea, select, button, summary, a[href], .cm-editor, [role="slider"], [role="menu"]',
    ) !== null
  );
}

/** Whether focus is somewhere text is typed, which has an undo of its own. */
function typesText(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.closest('input, textarea, .cm-editor') !== null
  );
}

/**
 * The app's keyboard shortcuts, for as long as the element is rendered: Space plays and stops, and
 * Cmd/Ctrl-Z and Shift-Cmd/Ctrl-Z undo and redo. Space is left alone while focus is on anything that uses
 * it (a button, a control, a field); undo and redo only where text is typed, which has its own. So a
 * slider or a handle that has just been dragged, and still has focus, can be undone at once.
 */
export default modifier<ShortcutsSignature>(
  (element, _positional, { onSpace, onUndo, onRedo }) => {
    const onKeydown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented) return;
      if (
        event.key === ' ' &&
        !usesKeys(event.target) &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        event.preventDefault(); // or the page (the track list) scrolls
        onSpace();
      } else if (
        event.key.toLowerCase() === 'z' &&
        (event.metaKey || event.ctrlKey) &&
        !typesText(event.target)
      ) {
        event.preventDefault();
        if (event.shiftKey) onRedo();
        else onUndo();
      }
    };
    const target = element.ownerDocument;
    target.addEventListener('keydown', onKeydown);
    return () => target.removeEventListener('keydown', onKeydown);
  },
);
