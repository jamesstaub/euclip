import { syntaxTree } from '@codemirror/language';
import { AudioNodeConfig } from './audio-node-config';

const nodeOptions = Object.keys(AudioNodeConfig);

export default function completeCrackedNode(context) {
  let nodeBefore = syntaxTree(context.state).resolveInner(context.pos, -1);
  console.log('name:', nodeBefore?.name);
  console.log('nextSib', nodeBefore?.nextSibling?.name);
  console.log('parent', nodeBefore?.parent?.name);
  console.log('ctx', context.tokenBefore(['Function','namespace', 'variableName', 'Identifier', 'Name', 'Term']));
  return;
  if (
    nodeBefore.name != 'BlockComment' ||
    context.state.sliceDoc(nodeBefore.from, nodeBefore.from + 3) != '/**'
  )
    return null;
  let textBefore = context.state.sliceDoc(nodeBefore.from, context.pos);
  let tagBefore = /@\w*$/.exec(textBefore);
  if (!tagBefore && !context.explicit) return null;
  return {
    from: tagBefore ? nodeBefore.from + tagBefore.index : context.pos,
    options: nodeOptions,
    validFor: /^(@\w*)?$/,
  };
}
