import { defineConfig } from 'vite';
import { extensions, classicEmberSupport, ember } from '@embroider/vite';
import { babel } from '@rollup/plugin-babel';

// cracked-up is linked from a sibling folder that has its own node_modules. Without this, its editor
// would load that folder's copies of CodeMirror while the app loads its own, and two copies of
// CodeMirror do not work together (extensions made by one are rejected by the other).
const oneCopyOnly = [
  '@codemirror/autocomplete',
  '@codemirror/commands',
  '@codemirror/lang-javascript',
  '@codemirror/language',
  '@codemirror/lint',
  '@codemirror/state',
  '@codemirror/view',
  '@lezer/common',
  '@lezer/highlight',
  '@lezer/javascript',
  '@lezer/lr',
  'crelt',
  'style-mod',
  'w3c-keyname',
];

export default defineConfig({
  resolve: {
    dedupe: oneCopyOnly,
  },
  plugins: [
    classicEmberSupport(),
    ember(),
    // extra plugins here
    babel({
      babelHelpers: 'runtime',
      extensions,
    }),
  ],
});
