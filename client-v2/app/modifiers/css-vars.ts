import { modifier } from 'ember-modifier';

export interface CssVarsSignature {
  Element: HTMLElement | SVGElement;
  Args: {
    /** custom property name (without the dashes) to value; a value of undefined removes it */
    Named: Record<string, string | number | undefined>;
  };
}

/**
 * Sets CSS custom properties on the element: `{{cssVars pos=0.4}}` gives `--pos: 0.4`. For values that
 * change as a control moves, where the stylesheet does the drawing and the template only says where.
 */
export default modifier<CssVarsSignature>((element, _positional, named) => {
  for (const [name, value] of Object.entries(named)) {
    if (value === undefined) element.style.removeProperty(`--${name}`);
    else element.style.setProperty(`--${name}`, String(value));
  }
});
