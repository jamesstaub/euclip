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

/**
 * The app's keyboard shortcuts, for as long as the element is rendered: Space plays and stops, and
 * Cmd/Ctrl-Z and Shift-Cmd/Ctrl-Z undo and redo. None of them fire while focus is in an editor or a
 * control, where those keys already mean something.
 */
export default modifier<ShortcutsSignature>(
  (element, _positional, { onSpace, onUndo, onRedo }) => {
    const onKeydown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented || usesKeys(event.target)) return;
      if (
        event.key === ' ' &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        event.preventDefault(); // or the page (the track list) scrolls
        onSpace();
      } else if (
        event.key.toLowerCase() === 'z' &&
        (event.metaKey || event.ctrlKey)
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
