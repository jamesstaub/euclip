import Modifier, { type ArgsFor } from 'ember-modifier';
import { registerDestructor, isDestroying } from '@ember/destroyable';
import type Owner from '@ember/owner';
import type { Editor } from 'cracked-up/editor';
import { loadEditor } from 'client-v2/editor/load';

export interface MountEditorSignature {
  Element: HTMLElement;
  Args: {
    Positional: [doc: string, onChange: ((value: string) => void) | undefined];
    Named: {
      /** the accessible name of the text area */
      label?: string;
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

  constructor(owner: Owner, args: ArgsFor<MountEditorSignature>) {
    super(owner, args);
    registerDestructor(this, () => this.#editor?.destroy());
  }

  modify(
    element: HTMLElement,
    [doc, onChange]: MountEditorSignature['Args']['Positional'],
    { label }: MountEditorSignature['Args']['Named'],
  ): void {
    this.#doc = doc;
    this.#onChange = onChange;

    if (this.#editor) {
      // text the host changed (the same script edited elsewhere); the user's own edits already match
      if (this.#editor.value !== doc) this.#editor.setValue(doc);
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
        ariaLabel: label ?? 'Code',
        onChange: (value) => this.#onChange?.(value),
      });
      element.dataset['editorReady'] = 'true';
    });
  }
}
