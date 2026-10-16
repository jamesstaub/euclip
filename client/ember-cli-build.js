'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const { Webpack } = require('@embroider/webpack');
const fs = require('fs');
const path = require('path');

/**
 * app/styles/app.css is a list of @imports of the other stylesheets. In development the browser fetches
 * them next to euclip.css, but in a production build those files are fingerprinted away and the CSS
 * minifier does not inline them, so the app shipped without most of its styles. For production the imports
 * are inlined into one file up front (the same order, relative to each file).
 */
function inlinedStyles() {
  const stylesDir = path.resolve(__dirname, 'app/styles');
  const inline = (file) =>
    fs.readFileSync(file, 'utf8').replace(/@import\s+['"]([^'"]+)['"]\s*;?/g, (_, target) =>
      inline(path.resolve(path.dirname(file), target))
    );
  const outDir = path.resolve(__dirname, 'tmp/inlined-styles');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'app.css'), inline(path.join(stylesDir, 'app.css')));
  return outDir;
}

module.exports = function (defaults) {
  let app = new EmberApp(defaults, {
    ...(process.env.EMBER_ENV === 'production' ? { trees: { styles: inlinedStyles() } } : {}),
    fingerprint: {
      prepend: '/',
    },

    'ember-cli-babel': {
      enableTypeScriptTransform: true,
      throwUnlessParallelizable: true,
    },

    babel: {
      plugins: [require.resolve('ember-auto-import/babel-plugin')],
    },

    minifyCSS: {
      enabled: true, // Minify and concatenate CSS
      options: { processImport: true },
    },

    minifyJS: {
      enabled: true,
      options: {
        output: {
          comments: false, // Remove comments from JS
        },
      },
    },

    'ember-math-helpers': {
      only: ['add', 'gt', 'gte', 'sub', 'mult', 'mod'],
    },

    'ember-composable-helpers': {
      only: ['compact', 'array', 'append'],
    },
  });

  app.import('node_modules/tachyons/css/tachyons.css');
  app.import('vendor/cracked.min.js.map');
  app.import('vendor/cracked.min.js');

  // cracked (the custom Web Audio library) is a global script built by
  // ../../i_dropped_my_phone_the_screen_cracked (`npm run build` there installs it here).
  return require('@embroider/compat').compatBuild(app, Webpack, {
    staticAddonTestSupportTrees: true,
    staticAddonTrees: true,
    staticHelpers: true,
    staticModifiers: true,
    staticComponents: true,
    // TODO: set splitAtRoutes (e.g. ['user.creator.project']) once route-level code splitting is wanted
    packagerOptions: {
      webpackConfig: {
        // sourcemaps in development only
        devtool: process.env.EMBER_ENV === 'production' ? false : 'source-map',
      },
    },
  });
};
