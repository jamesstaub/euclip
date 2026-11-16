import { modifier } from 'ember-modifier';

export interface OwnTextSignature {
  Element: HTMLInputElement;
  Args: {
    /** what the field shows when nobody is typing in it */
    Positional: [value: string | number];
  };
}

/**
 * Gives a text field its value, and keeps out of it while it has focus.
 *
 * While a person is typing, the text is theirs: half a number, nothing at all. A value bound in the
 * template is written back into the field whenever the template is brought up to date, and that
 * happens whenever anything the value is read from changes: for a value in the project, on every
 * change to the project (another control moved, a script's callback setting something as it plays).
 * So a field emptied with Backspace was filled again with the old number between two key presses.
 *
 * With this, the stored value is written into the field only when the field does not have focus; a
 * change that comes while it has focus (an undo, a script) shows when focus leaves, unless what was
 * typed is committed first, which then is the value.
 */
export default modifier<OwnTextSignature>((input, [value]) => {
  const text = String(value);
  const show = (): void => {
    if (input.value !== text) input.value = text;
  };
  if (input.ownerDocument.activeElement !== input) show();
  // after focus has left, and after whatever the leaving committed has been taken in
  const onBlur = (): void => {
    setTimeout(() => {
      if (input.isConnected && input.ownerDocument.activeElement !== input) {
        show();
      }
    });
  };
  input.addEventListener('blur', onBlur);
  return () => input.removeEventListener('blur', onBlur);
});
