import Modifier, { type ArgsFor } from 'ember-modifier';
import { registerDestructor, isDestroying } from '@ember/destroyable';
import type Owner from '@ember/owner';
import type { Editor } from 'cracked-up/editor';
import { loadEditor } from 'client-v2/editor/load';
import type { ScriptError } from 'client-v2/audio/runner';

/** A problem on a line of the script, as the app knows it. */
export interface LineProblem {
  line: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface MountEditorSignature {
  Element: HTMLElement;
  Args: {
    Positional: [doc: string, onChange: ((value: string) => void) | undefined];
    Named: {
      /** the accessible name of the text area */
      label?: string;
      /** the script's current error, or none */
      error?: ScriptError | null;
      /** problems the app has found on particular lines (declarations that cannot work) */
      problems?: readonly LineProblem[];
      /** a line to scroll to and flash; a new token asks again for the same line */
      reveal?: { line: number; token: number } | null;
      /** the line the person's cursor has moved to */
      onCursor?: (line: number) => void;
    };
  };
}

/**
 * Mounts a cracked-up editor in the element: loads the editor code on first use, keeps the editor's text
 * in step with `doc` when the host changes it, shows the app's per-line problems and the script's error,
 * goes to a line when asked, says where the cursor is, and destroys the editor with the element.
 */
export default class MountEditor extends Modifier<MountEditorSignature> {
  #editor: Editor | undefined;
  #loading = false;
  #doc = '';
  #onChange: ((value: string) => void) | undefined;
  #onCursor: ((line: number) => void) | undefined;
  #error: ScriptError | null = null;
  #shown: ScriptError | null = null;
  #problems: readonly LineProblem[] = [];
  #shownProblems = '[]';
  #reveal: { line: number; token: number } | null = null;
  #revealed = 0;

  constructor(owner: Owner, args: ArgsFor<MountEditorSignature>) {
    super(owner, args);
    registerDestructor(this, () => this.#editor?.destroy());
  }

  modify(
    element: HTMLElement,
    [doc, onChange]: MountEditorSignature['Args']['Positional'],
    {
      label,
      error,
      problems,
      reveal,
      onCursor,
    }: MountEditorSignature['Args']['Named'],
  ): void {
    this.#doc = doc;
    this.#onChange = onChange;
    this.#onCursor = onCursor;
    this.#error = error ?? null;
    this.#problems = problems ?? [];
    this.#reveal = reveal ?? null;

    if (this.#editor) {
      // text the host changed (the same script edited elsewhere); the user's own edits already match
      if (this.#editor.value !== doc) this.#editor.setValue(doc);
      this.#sync();
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
        onCursor: (cursor) => this.#onCursor?.(cursor.line),
      });
      element.dataset['editorReady'] = 'true';
      this.#sync();
    });
  }

  #sync(): void {
    this.#showError();
    this.#showProblems();
    this.#goToLine();
  }

  /** Shows the script's error in the editor (on its line when the editor can tell), or clears it. */
  #showError(): void {
    if (!this.#editor || this.#error === this.#shown) return;
    this.#shown = this.#error;
    if (this.#error) this.#editor.showError(this.#error.cause);
    else this.#editor.clearError();
  }

  /** Underlines the lines the app has something to say about. They follow their text through edits. */
  #showProblems(): void {
    if (!this.#editor) return;
    const next = JSON.stringify(this.#problems);
    if (next === this.#shownProblems) return;
    this.#shownProblems = next;
    this.#editor.setDiagnostics(
      this.#problems.map((problem) => ({ ...problem, source: 'Euclip' })),
    );
  }

  #goToLine(): void {
    const reveal = this.#reveal;
    if (!this.#editor || !reveal || reveal.token === this.#revealed) return;
    this.#revealed = reveal.token;
    this.#editor.reveal(
      { line: reveal.line },
      { flash: true, focus: true, select: 'cursor', align: 'center' },
    );
  }
}
