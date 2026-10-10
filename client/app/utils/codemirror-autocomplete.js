import { syntaxTree } from '@codemirror/language';
import { autocompletion } from '@codemirror/autocomplete';
import { objectCompletions } from './autocomplete/object-completions';
import { argCompletions } from './autocomplete/arg-completions';

// match if the cracked object has been invoked with a selector
// for example __('#sampler-1')
// eslint-disable-next-line no-useless-escape
const hasSelectorRegEx = /__\((\'|\")[\w\s-]+(\'|\")\)/;

const endsWithColonRegEx = /^\s*\w+:\s*$/;

// match if a user is about to enter a selector string in a cracked invocation
// eg. __("")
const autocompleteSelectorRegex = /__\(\'\'\)|__\(\"\"\)|__\(``\)/;

const STATES = {
  ALL_METHODS: 'all', // all methods and properties of the __ / cracked global object
  SOURCE_NODES: 'sourcenodes', // menu of audio source nodes or anything that can start a chain (lfo, adsr etc)
  UTILS: 'utils', // cracked methods and props that can be accessed on __. but are not part of a signal chain per se.
  ARG_LIST: 'args', // arguments of a function call
  ATTRS: 'attrs', // keys of an object inside an ARG_LIST
  PROPERTY: 'prop', // the value of a property
  SELECTED_NODE: 'selected', // menu of methods for a chaing after a cracked selector has been declared
  SELECTOR_ARG: 'selector', // menu of possible selectors for a cracked chain __("some-selector")
  NONE: null,
};

// returns a state based on surrounding context
// indicating the autocomplete menu contents
function getObjectCompletionstate(
  tokenBeforeText,
  nodeBeforeText,
  nodeBefore,
  nodeAfter
) {
  if (nodeBefore.isError) {
    return STATES.NONE;
  }
  if (tokenBeforeText === '__.') {
    return STATES.UTILS; // the cracked object is dmethods that can be called on cracked object without a node
  } else if (tokenBeforeText === '__().') {
    return STATES.SOURCE_NODES; // a new signal chain is constructed, show audio sources
  } else if (tokenBeforeText?.match(hasSelectorRegEx)) {
    return STATES.SELECTED_NODE; // a selector has been constructed, show nodes or other methods that can be called on the selected nodes
  } else if (
    nodeBefore.type.name === 'CallExpression' &&
    nodeAfter.type.name === 'String' &&
    nodeBeforeText.match(autocompleteSelectorRegex)
  ) {
    return STATES.SELECTOR_ARG; // cracked method has been invoked, completion for a selector string as first argument
  } else if (tokenBeforeText?.startsWith('__(')) {
    return STATES.ALL_METHODS;
  } else if (
    nodeBefore?.name === 'CallExpression' &&
    nodeAfter?.name === 'ArgList'
  ) {
    // options:
    //    - {} empty attr
    //    - {key1: default, key2: default} userParams
    return STATES.ARG_LIST;
  } else if (
    nodeBefore?.name === 'CallExpression' &&
    nodeAfter?.name === 'ObjectExpression'
  ) {
    return STATES.ATTRS;
  } else if (
    nodeBefore?.name === 'CallExpression' &&
    nodeAfter?.name === 'Property'
  ) {
    return STATES.PROPERTY;
  }
  return STATES.NONE;
}

// when entering ARG_LIST or ATTR find the method name that we're acting on
function getMethodName(menuState, tree, state, tokenBefore) {
  if (menuState == STATES.ARG_LIST || menuState == STATES.ATTRS) {
    const methodNameBuffer = tree.resolveInner(tokenBefore.from - 1);
    return state.sliceDoc(methodNameBuffer.from, methodNameBuffer.to);
  }
}

// which argument cursor is on if we're in the middle of a CallExpression
function getArgPosition(tokenBeforeText) {
  const isArgToken =
    tokenBeforeText?.startsWith('(') && tokenBeforeText.length > 1;
  if (isArgToken) {
    return tokenBeforeText.replace('(', '').split(',').length;
  } else {
    return 0;
  }
}

function createAttrsArgumentCompletion(completions) {
  if (!completions || completions.length == 0) {
    return [];
  }
  // an autocomplete option to set an attrs arg with default values
  return completions.reduce((acc, curr) => {
    return {
      label: `${curr.label}, ${acc.label}`,
      apply: `${curr.apply}\n\t${acc.apply}`,
      detail: 'deafult attrs',
      boost: 100,
    };
  });
}

// Arg completions would be the values can be passed into the function as an argument.
// audio nodes usually take a userParams object as the first argument
function getArgCompletions(methodName, position) {
  if (methodName === '__') {
    return [];
  }

  // TODO:
  // This would need to count which positional argument we're completing for, and pop()
  // off any that the user has already input
  const completions = getAttrsCompletions(methodName);
  const attrsArgComp = createAttrsArgumentCompletion(completions);

  if (attrsArgComp) {
    completions?.unshift(attrsArgComp);
  }

  if (!completions || completions.length == 0) {
    return [];
  }

  return completions.map((c) => {
    // this is a case where an `apply` property for the attributes completion
    // can be used to create an object literal for the first userParams Arg completion
    if (c.apply) {
      c.apply = `{ ${c.apply} }`;
    }
    return c;
  });
}

// called on array of arg-completions.
// adds a default value and cons
function mapDefaultsToAttrs(c) {
  {
    // for arguments that take a userParam object like `userParams.frequency`
    // split on the `.` and wrap it in `{}`
    const splitParam = c.label.split('.');

    // splitParam.length implies that the current arg is userParam.someMethod or params.someMethod
    // this case is autocompletes an object literal with the property for the first function argument
    if (splitParam.length > 1) {
      let defaultValue = c.defaultValue;
      let attr = splitParam.pop();
      if (attr == 'path') {
        defaultValue = 'this.filepath';
      }
      c.apply = `${attr}: ${defaultValue},`;
      c.attr = attr; // attr is not used in the completion, but used for filtering
    }

    return c;
  }
}

function getAttrsCompletions(methodName, tokenBeforeText = null) {
  if (!methodName) return;
  return argCompletions[methodName]
    ?.map(mapDefaultsToAttrs)
    .filter(({ attr }) => tokenBeforeText?.indexOf(`${attr}:`) == -1); // remove attributes that have alreay been declared in the object literal
}

// return autocomplete options for a given menu state
function completionsForState(state, methodName, argPosition, tokenBeforeText) {
  switch (state) {
    case STATES.ALL_METHODS:
      return getObjectCompletions();
    case STATES.SOURCE_NODES:
      return getObjectCompletions(
        'Sampler',
        'Control',
        'Synth',
        'Modulation',
        'Node'
      );
    case STATES.UTILS:
      return getObjectCompletions(
        'Find',
        'Control',
        'Sequence',
        'Midi',
        'Connect',
        'Debug',
        'Type',
        'Algorithmic',
        'Interaction',
        'Miscellaneous',
        'Utility'
      );
    case STATES.ARG_LIST:
      return getArgCompletions(methodName, argPosition);
    case STATES.ATTRS:
      return getAttrsCompletions(methodName, tokenBeforeText);
    case STATES.PROPERTY:
      console.log('PROPERTY autocomplete default value?');
      return [];
    case STATES.SELECTED_NODE:
      return getObjectCompletions('Control', 'Connect', 'Find');
    case STATES.SELECTOR_ARG:
      return getSelectorCompletions();
    case STATES.NONE:
      return [];
  }
}

export const crackedCompletion = autocompletion({
  override: [
    (context) => {
      const { state, pos } = context;
      const line = state.doc.lineAt(pos);
      if (!line) return null;
      const tree = syntaxTree(context.state);
      const tokenBefore = context.tokenBefore([
        'MemberExpression',
        'PropertyName',
        'CallExpression',
        'Expression',
        'ArgList',
      ]);
      const tokenBeforeText = tokenBefore?.text.replace(/\s/g, '');
      const nodeBefore = tree.resolveInner(tokenBefore?.from);
      const nodeAfter = tree.resolveInner(tokenBefore?.to);
      const nodeBeforeText = state.sliceDoc(nodeBefore.from, nodeBefore.to);
      let word = context.matchBefore(/\w*/);

      const menuState = getObjectCompletionstate(
        tokenBeforeText,
        nodeBeforeText,
        nodeBefore,
        nodeAfter
      );

      const methodName = getMethodName(menuState, tree, state, tokenBefore);
      const argPosition = getArgPosition(tokenBeforeText);

      const completions = completionsForState(
        menuState,
        methodName,
        argPosition,
        tokenBeforeText
      );

      // CompletionResult
      return {
        from: word.from,
        filter: true,
        validFor: /\w*/,
        options: completions,
      };
    },
  ],
});

/**
 * these completions are made from the parse-doc.js script in my fork of i_dropped_my_phone_and_the_screen_cracked repo
 * possible types to filter by in arguments
'Find', 'Control', 'Node', 
'Sequence',  
'Midi', 'Connect', 
'Debug',  
'Type',  
'Algorithmic', 'Delay',  
'Distortion', 'Envelope',  
'Filter', 'Interaction',  
'Miscellaneous', 'Sampler', 'Modulator',  
'Noise', 'Oscillator', 'Setters', 'Synth', 'Utility', 
 */
function getObjectCompletions() {
  const args = Array.from(arguments);
  let completions = objectCompletions.map((c) => {
    return { ...c, detail: `(${c.type}) ${c.detail}` };
  });
  if (args.length == 0) {
    return completions;
  }
  return completions.filter((o) => {
    return args.indexOf(o.type) > -1;
  });
}

function getSelectorCompletions() {
  console.log(
    'TODO: show autocomplete list of possible selectors for available nodes'
  );
  return [];
}
