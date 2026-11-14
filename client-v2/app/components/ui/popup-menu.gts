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
}

function role(item: MenuItem): string {
  return item.checked === undefined ? 'menuitem' : 'menuitemradio';
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

export interface PopupMenuSignature {
  Element: HTMLDivElement;
  Args: {
    /** what the menu is for: the button's accessible name */
    label: string;
    items: readonly MenuItem[];
    /** the menu is controlled: whoever owns it says whether it is open (so a long press can open it) */
    open: boolean;
    onOpenChange: (open: boolean) => void;
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

  select = (item: MenuItem): void => {
    if (item.disabled) return;
    this.args.onOpenChange(false);
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
        class="icon-btn popup-menu__button"
        aria-label={{@label}}
        aria-haspopup="menu"
        aria-expanded={{if @open "true" "false"}}
        data-test-menu-button
        {{on "click" this.toggle}}
      >
        <Icon @name="dots" />
      </button>
      {{#if @open}}
        <ul
          class="menu"
          role="menu"
          aria-label={{@label}}
          data-test-menu
          {{focusFirst}}
        >
          {{#each @items as |item|}}
            <li role="none" class={{if item.separated "menu__separated"}}>
              <button
                type="button"
                class="menu__item"
                role={{role item}}
                aria-checked={{checked item}}
                aria-disabled={{if item.disabled "true"}}
                tabindex="-1"
                data-test-menu-item={{item.label}}
                {{on "click" (fn this.select item)}}
              >{{item.label}}</button>
            </li>
          {{/each}}
        </ul>
      {{/if}}
    </div>
  </template>
}
