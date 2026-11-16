import { modifier } from 'ember-modifier';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectOptionsSignature {
  Element: HTMLSelectElement;
  Args: {
    Positional: [options: readonly SelectOption[], value: string | undefined];
  };
}

/** What each select was last given, so that being drawn again with the same things touches nothing. */
const built = new WeakMap<HTMLSelectElement, string>();

/**
 * Gives a native `<select>` its options and its value, and then leaves it alone.
 *
 * A menu drawn from the running project is asked for again whenever anything about the project changes
 * (a value moves, a script's callback sets a parameter, a sound arrives). Written as a loop in the
 * template, every one of those rebuilt the menu's children: on some, all its options; on all, at least
 * the loop's own markers. A native menu that is open while its children are replaced under it loses its
 * list, or will not close. Here the option elements are made once, replaced only when the list of
 * options is really different, and the value is set only when it is not already that.
 */
export default modifier<SelectOptionsSignature>((select, [options, value]) => {
  const key = JSON.stringify(options.map(({ value: v, label }) => [v, label]));
  if (built.get(select) !== key) {
    built.set(select, key);
    select.replaceChildren(
      ...options.map(({ value: v, label }) => {
        const option = select.ownerDocument.createElement('option');
        option.value = v;
        option.textContent = label;
        return option;
      }),
    );
  }
  if (value !== undefined && select.value !== value) select.value = value;
});
