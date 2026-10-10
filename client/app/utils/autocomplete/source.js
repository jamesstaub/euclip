import { analyzeContext } from './context';
import {
  memberCompletions,
  keyCompletions,
  valueCompletions,
  rootCompletions,
  selectorCompletions,
} from './completions';

const WORD = /^[\w$]*$/;
// selector tokens may start with # or . and contain - (e.g. "#kick-drum")
const SELECTOR_TOKEN = /^[#.\w$-]*$/;

/**
 * CompletionSource for the script editors. Works out the context with `analyzeContext`
 * and returns the matching list; CodeMirror does the filtering and ranking as the user types.
 */
export function crackedCompletionSource(context) {
  const text = context.state.sliceDoc(0, context.pos);
  const found = analyzeContext(text);
  if (!found) return null;

  switch (found.kind) {
    case 'member':
      return {
        from: found.from,
        options: memberCompletions(found.receiver),
        validFor: WORD,
      };

    case 'key':
      return {
        from: found.from,
        options: keyCompletions(found.method, found.used),
        validFor: WORD,
      };

    case 'value': {
      const options = valueCompletions(found.method, found.key);
      return options.length
        ? { from: found.from, options, validFor: /^[\w$.]*$/ }
        : null;
    }

    case 'selector': {
      // the token being typed starts after the last comma / space: "sine, .ba|"
      const token = /[^,\s]*$/.exec(found.query)[0];
      return {
        from: context.pos - token.length,
        options: selectorCompletions(context.state.doc.toString()),
        validFor: SELECTOR_TOKEN,
      };
    }

    case 'root': {
      // don't pop the menu open for every word; wait for a character or an explicit request
      if (!context.explicit && found.query.length < 1) return null;
      return { from: found.from, options: rootCompletions(), validFor: WORD };
    }

    default:
      return null;
  }
}
