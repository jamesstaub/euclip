import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import { modifier } from 'ember-modifier';
import onOutside from 'client-v2/modifiers/on-outside';

let hints = 0;

/** How close to the edge of the screen the popover may come, in px. */
const MARGIN = 8;

export interface HintSignature {
  Element: HTMLSpanElement;
  Args: {
    /** what the hints are about, for the button's accessible name: "About the waveform editor" */
    label: string;
  };
  Blocks: {
    /** the hints: a few short lines or a list */
    default: [];
  };
}

/**
 * The app's one way of offering help: a small "?" button that opens a popover with the hints.
 *
 * Nothing in the app explains itself by default (design doc, "Hints are behind a ?"): an interface
 * that has something to say about how it works has one of these, and what it says stays out of the way
 * until asked for. What is going on now (an error, a warning, a count, a value) is not a hint and is
 * shown where it applies.
 *
 * It opens on a click or a tap (never on hover alone), and closes on a second one, on Escape (focus
 * goes back to the button), and on a press or focus anywhere else. The popover is placed under the
 * button, or above it where there is no room below, and is always kept inside the screen: on a phone
 * it is as wide as the screen allows.
 */
export default class Hint extends Component<HintSignature> {
  @tracked open = false;

  id = `hint-${++hints}`;

  toggle = (): void => {
    this.open = !this.open;
  };

  close = (): void => {
    if (this.open) this.open = false;
  };

  onKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || !this.open) return;
    event.stopPropagation(); // (not also whatever else Escape would close)
    this.open = false;
    (event.currentTarget as HTMLElement)
      .querySelector<HTMLElement>('.hint__button')
      ?.focus();
  };

  /** Puts the popover by its button, inside the screen, and keeps it there as things move. */
  place = modifier((panel: HTMLElement) => {
    const button =
      panel.parentElement?.querySelector<HTMLElement>('.hint__button');
    const position = (): void => {
      if (!button) return;
      const view = window.visualViewport;
      const width = view?.width ?? window.innerWidth;
      const height = view?.height ?? window.innerHeight;
      const at = button.getBoundingClientRect();
      const size = panel.getBoundingClientRect();
      const left = Math.max(
        MARGIN,
        Math.min(at.left, width - size.width - MARGIN),
      );
      const below = at.bottom + 4;
      const above = at.top - 4 - size.height;
      const top =
        below + size.height <= height - MARGIN || above < MARGIN
          ? Math.min(below, Math.max(MARGIN, height - size.height - MARGIN))
          : above;
      panel.style.left = `${Math.round(left)}px`;
      panel.style.top = `${Math.round(top)}px`;
      // (where an ancestor makes itself the frame for fixed things, "fixed" is not the screen: put it
      // where it was meant to be, whatever the frame)
      const now = panel.getBoundingClientRect();
      if (Math.abs(now.left - left) > 1 || Math.abs(now.top - top) > 1) {
        panel.style.left = `${Math.round(2 * left - now.left)}px`;
        panel.style.top = `${Math.round(2 * top - now.top)}px`;
      }
    };
    position();
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    return () => {
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
    };
  });

  <template>
    {{! template-lint-disable no-invalid-interactive }}
    {{! Escape is heard once, here, for the button and the popover }}
    <span
      class="hint"
      ...attributes
      {{onOutside this.close}}
      {{on "keydown" this.onKeydown}}
    >
      <button
        type="button"
        class="hint__button"
        aria-label={{@label}}
        aria-expanded={{if this.open "true" "false"}}
        aria-controls={{this.id}}
        data-test-hint-button
        {{on "click" this.toggle}}
      >?</button>
      {{#if this.open}}
        <div
          class="hint__panel"
          id={{this.id}}
          role="note"
          aria-label={{@label}}
          data-test-hint
          {{this.place}}
        >{{yield}}</div>
      {{/if}}
    </span>
  </template>
}
