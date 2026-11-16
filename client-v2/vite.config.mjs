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

// The sound library, for development and preview: the deployed v1 API answers only requests that do
// not come from another origin (it refuses those with 406), and the audio bucket allows cross-origin
// reads from a short list of origins. Asked for through this server both are same-origin to the page.
// Read-only: nothing of the person's goes with a request (the browser's Origin and cookies are dropped).
const anonymous = (proxy) => {
  proxy.on('proxyReq', (request) => {
    request.removeHeader('origin');
    request.removeHeader('referer');
    request.removeHeader('cookie');
  });
};
const libraryProxy = {
  '/v1/files': {
    target: process.env.EUCLIP_LIBRARY_HOST || 'https://www.euclip.app',
    changeOrigin: true,
    configure: anonymous,
  },
  '/library-audio': {
    target: 'https://storage.googleapis.com',
    changeOrigin: true,
    rewrite: (path) =>
      path.replace(
        /^\/library-audio/,
        '/euclidean-cracked.appspot.com/Drum%20Machines%20mp3',
      ),
    configure: anonymous,
  },
};

export default defineConfig({
  server: { proxy: libraryProxy },
  preview: { proxy: libraryProxy },
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
