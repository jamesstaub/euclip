import Modifier, { type ArgsFor } from 'ember-modifier';
import { registerDestructor, isDestroying } from '@ember/destroyable';
import type Owner from '@ember/owner';
import type { Editor } from 'cracked-up/editor';
import { loadEditor } from 'client-v2/editor/load';
import type { ScriptError } from 'client-v2/audio/runner';

export interface MountEditorSignature {
  Element: HTMLElement;
  Args: {
    Positional: [doc: string, onChange: ((value: string) => void) | undefined];
    Named: {
      /** the accessible name of the text area */
      label?: string;
      /** the script's current error, or none */
      error?: ScriptError | null;
    };
  };
}

/**
 * Mounts a cracked-up editor in the element: loads the editor code on first use, keeps the editor's text
 * in step with `doc` when the host changes it, and destroys the editor with the element.
 */
export default class MountEditor extends Modifier<MountEditorSignature> {
  #editor: Editor | undefined;
  #loading = false;
  #doc = '';
  #onChange: ((value: string) => void) | undefined;
  #error: ScriptError | null = null;
  #shown: ScriptError | null = null;

  constructor(owner: Owner, args: ArgsFor<MountEditorSignature>) {
    super(owner, args);
    registerDestructor(this, () => this.#editor?.destroy());
  }

  modify(
    element: HTMLElement,
    [doc, onChange]: MountEditorSignature['Args']['Positional'],
    { label, error }: MountEditorSignature['Args']['Named'],
  ): void {
    this.#doc = doc;
    this.#onChange = onChange;
    this.#error = error ?? null;

    if (this.#editor) {
      // text the host changed (the same script edited elsewhere); the user's own edits already match
      if (this.#editor.value !== doc) this.#editor.setValue(doc);
      this.#showError();
      return;
    }
    if (this.#loading) return;
    this.#loading = true;

    void loadEditor().then(({ createEditor, catalog }) => {
      if (isDestroying(this)) return;
      this.#editor = createEditor({
        parent: element,
        doc: this.#doc,
        catalog,
        theme: 'dark',
        // the footer's status strip says the message; the editor only marks the line
        errorPanel: false,
        ariaLabel: label ?? 'Code',
        onChange: (value) => this.#onChange?.(value),
      });
      element.dataset['editorReady'] = 'true';
      this.#showError();
    });
  }

  /** Shows the script's error in the editor (on its line when the editor can tell), or clears it. */
  #showError(): void {
    if (!this.#editor || this.#error === this.#shown) return;
    this.#shown = this.#error;
    if (this.#error) this.#editor.showError(this.#error.cause);
    else this.#editor.clearError();
  }
}
