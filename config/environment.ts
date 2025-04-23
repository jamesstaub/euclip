'use strict';

import type { EnvironmentConfig } from './types/environment-types';

module.exports = function (environment: string): EnvironmentConfig {
  let ENV: EnvironmentConfig = {
    modulePrefix: 'euclip',
    environment,
    rootURL: '/', // Ensure this is a valid string
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
      DISCORD_CLIENT_ID: '1360670663660278031',
      PROXY_PREFIX: '/.proxy',
      API_PREFIX: '/v1', // this gets dynamically overwritten in discord initializer
      ASSETS_PATH: '/assets',
      AUDIO_CDN_ROOT: 'https://storage.googleapis.com/euclidean-cracked.appspot.com',
      DRUMMACHINES_PATH: `/Drum%20Machines%20mp3`,
      DRUMMACHINES_CDN_PATH: '',
      DRUMMACHINES_PROXY_PATH: '/drum-machines',
    },
  };

  ENV.APP.DRUMMACHINES_CDN_PATH = `${ENV.APP.AUDIO_CDN_ROOT}${ENV.APP.DRUMMACHINES_PATH}`;

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.DRUMMACHINES_PATH = '/assets/audio/drum-machines';
  }

  if (environment === 'test') {
    ENV.locationType = 'none';
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;
    ENV.APP.rootElement = '#ember-testing';
    ENV.APP.autoboot = false;
  }

  return ENV;
};
