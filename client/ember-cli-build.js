'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const { Webpack } = require('@embroider/webpack');

module.exports = function (defaults) {
  let app = new EmberApp(defaults, {
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
      only: ['compact', 'array'],
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
