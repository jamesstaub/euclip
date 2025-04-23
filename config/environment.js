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
      registrationEndpoint: '/registration',
      userEndpoint: '/login',
      invalidateEndpoint: '/logout',

    },
  };

  ENV.APP.DISCORD_CLIENT_ID = '1360670663660278031';
  ENV.APP.PROXY_PREFIX = '/.proxy';
  ENV.APP.API_PREFIX = '/v1'; // this gets dynamically overwritten in discord initialzier
  ENV.APP.ASSETS_PATH = '/assets';

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.DRUMMACHINES_PATH = '/assets/audio/drum-machines';
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

  ENV.APP.AUDIO_CDN_ROOT =
    'https://storage.googleapis.com/euclidean-cracked.appspot.com';
  ENV.APP.DRUMMACHINES_PATH = `/Drum%20Machines%20mp3`;
  
  ENV.APP.DRUMMACHINES_CDN_PATH = `${ENV.APP.AUDIO_CDN_ROOT}${ENV.APP.DRUMMACHINES_PATH}`;


  // when running inside discord iframe 3rd party requests  get proxied
  // https://discord.com/developers/applications/1360670663660278031/embedded/url-mappings
  ENV.APP.DRUMMACHINES_PROXY_PATH = '/drum-machines';

  return ENV;
};
