import type { TOC } from '@ember/component/template-only';
import mountEditor from 'client-v2/modifiers/mount-editor';

export interface CodeEditorSignature {
  Element: HTMLDivElement;
  Args: {
    /** the script's text */
    doc: string;
    /** called with the whole text after each edit the user makes */
    onChange?: (value: string) => void;
    /** the accessible name of the text area, e.g. "Track 1 script" */
    label?: string;
  };
}

/**
 * A code editor for one cracked-up script (`createEditor` from cracked-up/editor, CodeMirror 6), themed
 * in styles/code-editor.css. All editors share one catalog. Nothing here runs the script.
 */
const CodeEditor: TOC<CodeEditorSignature> = <template>
  <div
    class="code-editor"
    data-test-code-editor
    ...attributes
    {{mountEditor @doc @onChange label=@label}}
  ></div>
</template>;

export default CodeEditor;
