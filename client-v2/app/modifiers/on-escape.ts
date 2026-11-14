import { modifier } from 'ember-modifier';

export interface OnEscapeSignature {
  Element: HTMLElement;
  Args: {
    Positional: [handler: () => void];
  };
}

/** Calls the handler when Escape is pressed anywhere in the document, for as long as the element is rendered. */
export default modifier<OnEscapeSignature>((element, [handler]) => {
  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && !event.defaultPrevented) handler();
  };
  const target = element.ownerDocument;
  target.addEventListener('keydown', onKeydown);
  return () => target.removeEventListener('keydown', onKeydown);
});
