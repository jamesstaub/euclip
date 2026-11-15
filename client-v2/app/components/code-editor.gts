import type { TOC } from '@ember/component/template-only';
import mountEditor from 'client-v2/modifiers/mount-editor';
import type { LineProblem } from 'client-v2/modifiers/mount-editor';
import type { ScriptError } from 'client-v2/audio/runner';

export interface CodeEditorSignature {
  Element: HTMLDivElement;
  Args: {
    /** the script's text */
    doc: string;
    /** called with the whole text after each edit the user makes */
    onChange?: (value: string) => void;
    /** the accessible name of the text area, e.g. "Track 1 script" */
    label?: string;
    /** an error in the script as it is, shown under the code and on its line when the editor can tell */
    error?: ScriptError | null;
    /** problems on particular lines, underlined in the code */
    problems?: readonly LineProblem[];
    /** a line to go to and flash */
    reveal?: { line: number; token: number } | null;
    /** the line the person's cursor has moved to */
    onCursor?: (line: number) => void;
  };
}

/**
 * A code editor for one cracked-up script (`createEditor` from cracked-up/editor, CodeMirror 6), themed
 * in styles/code-editor.css. All editors share one catalog. It only edits: running the script is the
 * audio service's job.
 */
const CodeEditor: TOC<CodeEditorSignature> = <template>
  <div
    class="code-editor"
    data-test-code-editor
    ...attributes
    {{mountEditor
      @doc
      @onChange
      label=@label
      error=@error
      problems=@problems
      reveal=@reveal
      onCursor=@onCursor
    }}
  ></div>
</template>;

export default CodeEditor;
