import { autocompletion } from '@codemirror/autocomplete';
import { crackedCompletionSource } from './autocomplete/source';

/**
 * Autocompletion for the cracked script editors:
 *  - methods on `__.`, `__("selector").` and `this.`, ranked by where you are in a signal chain
 *  - option keys inside `.lowpass({ | })`
 *  - selectors (#ids, .classes, node types) inside `__("|")`
 */
export const crackedCompletion = autocompletion({
  override: [crackedCompletionSource],
  icons: true,
});
