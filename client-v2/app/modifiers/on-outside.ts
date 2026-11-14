import { modifier } from 'ember-modifier';

export interface OnOutsideSignature {
  Element: HTMLElement;
  Args: {
    Positional: [handler: () => void];
  };
}

/** Calls the handler when a pointer goes down, or focus lands, outside the element. For closing menus. */
export default modifier<OnOutsideSignature>((element, [handler]) => {
  const check = (event: Event): void => {
    if (event.target instanceof Node && !element.contains(event.target))
      handler();
  };
  const target = element.ownerDocument;
  target.addEventListener('pointerdown', check, true);
  target.addEventListener('focusin', check, true);
  return () => {
    target.removeEventListener('pointerdown', check, true);
    target.removeEventListener('focusin', check, true);
  };
});
