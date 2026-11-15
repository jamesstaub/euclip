import { modifier } from 'ember-modifier';

/** Scrolls the element into view when the condition becomes true (within its pane; the page never moves). */
export default modifier<{
  Element: HTMLElement;
  Args: { Positional: [when: boolean] };
}>((element, [when]) => {
  if (when) element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
});
