import type { TOC } from '@ember/component/template-only';
import { on } from '@ember/modifier';
import Icon from 'client-v2/components/icon';
import dialogFocus from 'client-v2/modifiers/dialog-focus';

let dialogs = 0;

export interface DialogSignature {
  Element: HTMLDivElement;
  Args: {
    /** the dialog's name: its heading and its accessible name */
    title: string;
    /** the close button's accessible name */
    closeLabel: string;
    onClose: () => void;
    /** where focus goes when it closes */
    returnTo?: HTMLElement | null;
  };
  Blocks: {
    default: [];
    actions: [];
  };
}

/**
 * The app's one modal dialog: a square panel over a dimmed scrim, fixed to the screen so that nothing
 * in the layout moves when it opens. Focus goes in, stays in, and goes back on close; Escape and the
 * close button close it. Elements marked `data-autofocus` get focus first.
 */
const Dialog: TOC<DialogSignature> = <template>
  {{#let (nextId) as |id|}}
    <div class="dialog" ...attributes>
      <div
        class="dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={{id}}
        {{dialogFocus onClose=@onClose returnTo=@returnTo}}
      >
        <header class="dialog__head">
          <h2 class="dialog__title" id={{id}}>{{@title}}</h2>
          <button
            type="button"
            class="icon-btn dialog__close"
            aria-label={{@closeLabel}}
            data-test-dialog-close
            {{on "click" @onClose}}
          ><Icon @name="cancel" /></button>
        </header>
        <div class="dialog__body">{{yield}}</div>
        {{#if (has-block "actions")}}
          <footer class="dialog__actions">{{yield to="actions"}}</footer>
        {{/if}}
      </div>
    </div>
  {{/let}}
</template>;

function nextId(): string {
  return `dialog-title-${++dialogs}`;
}

export default Dialog;
