import Component from '@glimmer/component';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { modifier } from 'ember-modifier';
import Icon from 'client-v2/components/icon';
import onOutside from 'client-v2/modifiers/on-outside';

export interface MenuItem {
  label: string;
  /** one of a set of choices: drawn with a mark, and announced as chosen or not */
  checked?: boolean;
  /** shown, but cannot be chosen (something that is coming) */
  disabled?: boolean;
  /** starts a new group: a line is drawn above it */
  separated?: boolean;
  onSelect?: () => void;
  /** keeps its identity when the list is made again (default: its label, which must then be unique) */
  id?: string;
  /** one of several that can each be on: `checked` is its state, and choosing it leaves the menu open */
  toggle?: boolean;
  /** why it cannot be chosen (or what it does): shown quietly after the label, and as its title */
  hint?: string;
  /** a title for the items after it, not a choice */
  heading?: boolean;
}

function role(item: MenuItem): string {
  return item.checked === undefined
    ? 'menuitem'
    : item.toggle
      ? 'menuitemcheckbox'
      : 'menuitemradio';
}

function checked(item: MenuItem): string | undefined {
  return item.checked === undefined
    ? undefined
    : item.checked
      ? 'true'
      : 'false';
}

/** When the menu opens, focus goes to its chosen item, or its first. */
const focusFirst = modifier<{ Element: HTMLElement }>((element) => {
  const items = [
    ...element.querySelectorAll<HTMLElement>(
      '[role^="menuitem"]:not([aria-disabled])',
    ),
  ];
  (
    items.find((item) => item.getAttribute('aria-checked') === 'true') ??
    items[0]
  )?.focus();
});

/**
 * A menu that opens above its button stands on the screen itself (not in the box that scrolls its
 * button, which would cut it off): over the button where there is room, lower where there is not, and
 * always inside the window. Worked out from where things are drawn and corrected by where the menu then
 * is, so it does not matter what it is positioned against.
 */
const placeUp = modifier<{
  Element: HTMLElement;
  Args: { Positional: [up: boolean | undefined] };
}>((menu, [up]) => {
  const button = menu.parentElement?.querySelector<HTMLElement>(
    '.popup-menu__button',
  );
  if (!up || !button) return;
  menu.style.position = 'fixed';
  menu.style.inset = 'auto';
  menu.style.left = '0px';
  menu.style.top = '0px';
  const on = button.getBoundingClientRect();
  const zero = menu.getBoundingClientRect();
  const margin = 4;
  const clamp = (value: number, low: number, high: number): number =>
    Math.min(Math.max(value, low), Math.max(low, high));
  const left = clamp(on.left, margin, window.innerWidth - margin - zero.width);
  const top = clamp(
    on.top - zero.height,
    margin,
    window.innerHeight - margin - zero.height,
  );
  menu.style.left = `${left - zero.left}px`;
  menu.style.top = `${top - zero.top}px`;
});

export interface PopupMenuSignature {
  Element: HTMLDivElement;
  Args: {
    /** what the menu is for: the button's accessible name */
    label: string;
    items: readonly MenuItem[];
    /** the menu is controlled: whoever owns it says whether it is open (so a long press can open it) */
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** a word or two on the button, in place of the dots (a menu that says what is chosen) */
    text?: string;
    /** the menu opens above its button (for one at the foot of a pane) */
    up?: boolean;
  };
}

/**
 * A small menu behind a visible button (⋮). The button opens it; so can its owner, for a right click
 * or a long press on the thing it belongs to. Arrow keys move through it, Escape closes it and gives
 * focus back to the button, and pressing or focusing anything outside closes it.
 */
export default class PopupMenu extends Component<PopupMenuSignature> {
  toggle = (): void => this.args.onOpenChange(!this.args.open);
  close = (): void => {
    if (this.args.open) this.args.onOpenChange(false);
  };

  /** (keyed by identity, so a list made again while the transport runs keeps its buttons) */
  get keyed(): (MenuItem & { key: string })[] {
    return this.args.items.map((item) => ({
      ...item,
      key: item.id ?? item.label,
    }));
  }

  select = (item: MenuItem): void => {
    if (item.disabled) return;
    if (!item.toggle) this.args.onOpenChange(false);
    item.onSelect?.();
  };

  onKeydown = (event: KeyboardEvent): void => {
    const root = event.currentTarget as HTMLElement;
    if (event.key === 'Escape' && this.args.open) {
      event.stopPropagation();
      this.args.onOpenChange(false);
      root.querySelector<HTMLElement>('.popup-menu__button')?.focus();
      return;
    }
    if (!this.args.open) return;
    const items = [
      ...root.querySelectorAll<HTMLElement>(
        '[role^="menuitem"]:not([aria-disabled])',
      ),
    ];
    const at = items.indexOf(document.activeElement as HTMLElement);
    const move = (index: number): void => {
      event.preventDefault();
      items[(index + items.length) % items.length]?.focus();
    };
    if (event.key === 'ArrowDown') move(at + 1);
    else if (event.key === 'ArrowUp') move(at - 1);
    else if (event.key === 'Home') move(0);
    else if (event.key === 'End') move(items.length - 1);
  };

  <template>
    {{! template-lint-disable no-invalid-interactive }}
    {{! the keys of the open menu are handled once, here }}
    <div
      class="popup-menu"
      ...attributes
      {{onOutside this.close}}
      {{on "keydown" this.onKeydown}}
    >
      <button
        type="button"
        class="{{if @text 'btn btn--s btn--quiet' 'icon-btn'}}
          popup-menu__button"
        aria-label={{@label}}
        aria-haspopup="menu"
        aria-expanded={{if @open "true" "false"}}
        data-test-menu-button
        {{on "click" this.toggle}}
      >
        {{#if @text}}<span class="truncate">{{@text}}</span>{{else}}<Icon
            @name="dots"
          />{{/if}}
      </button>
      {{#if @open}}
        <ul
          class="menu {{if @up 'menu--up'}}"
          role="menu"
          aria-label={{@label}}
          data-test-menu
          {{placeUp @up}}
          {{focusFirst}}
        >
          {{! keyed: the owner's list is made again whenever the running project changes (every step while it plays), and items replaced under the pointer cannot be clicked }}
          {{#each this.keyed key="key" as |item|}}
            {{#if item.heading}}
              <li
                role="presentation"
                class="menu__heading {{if item.separated 'menu__separated'}}"
              >{{item.label}}</li>
            {{else}}
              <li role="none" class={{if item.separated "menu__separated"}}>
                <button
                  type="button"
                  class="menu__item"
                  role={{role item}}
                  aria-checked={{checked item}}
                  aria-disabled={{if item.disabled "true"}}
                  tabindex="-1"
                  title={{item.hint}}
                  data-test-menu-item={{item.label}}
                  {{on "click" (fn this.select item)}}
                >{{item.label}}{{#if item.hint}}<span
                      class="menu__hint"
                    >{{item.hint}}</span>{{/if}}</button>
              </li>
            {{/if}}
          {{/each}}
        </ul>
      {{/if}}
    </div>
  </template>
}
