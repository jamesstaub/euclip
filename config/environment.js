'use strict';

module.exports = function (environment) {
  let ENV = {
    modulePrefix: 'euclip',
    environment,
    rootURL: '/',
    locationType: 'history',
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. EMBER_MODULE_UNIFICATION: true
      },
    },

    contentSecurityPolicy: {
      'connect-src': '*',
    },

    'ember-simple-auth': {
      routeAfterAuthentication: 'user',
    },

    APP: {
      userEndpoint: '/login',
      invalidateEndpoint: '/logout',
      registrationEndpoint: '/registration',
    },
  };

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    ENV.APP.DRUMMACHINES_PATH = '/assets/audio/drum-machines';
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
    ENV.APP.autoboot = false;
  }

  if (environment === 'production') {
    ENV.APP.DRUMMACHINES_PATH =
      'https://storage.googleapis.com/euclidean-cracked.appspot.com/Drum%20Machines%20mp3';
  }

  return ENV;
};
