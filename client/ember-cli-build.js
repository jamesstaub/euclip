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

    autoImport: {
      skipBabel: ['cracked.min.js'],
    },

    babel: {
      plugins: [require.resolve('ember-auto-import/babel-plugin')],
    },

    sourcemaps: {
      enabled: false, // Disable sourcemaps for production
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

    ace: {
      themes: ['ambiance', 'chaos'],
      modes: ['javascript'],
      workers: ['javascript'],
      exts: ['language_tools'],
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

  // Use `app.import` to add additional libraries to the generated
  // output files.
  //
  // If you need to use different assets in different
  // environments, specify an object as the first parameter. That
  // object's keys should be the environment name and the values
  // should be the asset to use in that environment.
  //
  // If the library that you are including contains AMD or ES6
  // modules that you would like to import into your application
  // please specify an object with the list of modules as keys
  // along with the exports of each module as its value.

  return require('@embroider/compat').compatBuild(app, Webpack, {
    staticAddonTestSupportTrees: true,
    staticAddonTrees: true,
    staticHelpers: true,
    staticModifiers: true,
    staticComponents: true,
    splitAtRoutes: ['route.name'], // Adjust as needed
    packagerOptions: {
      webpackConfig: {
        devtool: 'source-map',
      },
    },
  });
};
