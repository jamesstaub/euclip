'use strict';

module.exports = function(environment) {
  let ENV = {
    modulePrefix: 'euclip',
    environment,
    rootURL: '/',
    locationType: 'auto',
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. EMBER_MODULE_UNIFICATION: true
      },
      EXTEND_PROTOTYPES: {
        // Prevent Ember Data from overriding Date.parse.
        Date: false
      }
    },

    APP: {
      userEndpoint: '/users/me',
      supportedAudioNodes: [
        'allpasss', 
        'bandpass', 
        'bitcrusher', 
        'comb',
        'delay', 
        'gain', 
        'highpass', 
        'highshelf', 
        'lowshelf', 
        'lowpass', 
        'notch', 
        'overdrive', 
        'peaking', 
        'reverb', 
        'ring', 
        'sampler',
        'sine',
        'square',
        'sawtooth',
      ]
      // Here you can pass flags/options to your application instance
      // when it is created
    }
  };


  if (environment === 'development') {
    ENV['ember-cli-mirage'] = {
      enabled: true
    };
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    ENV.APP.DRUMSERVER_HOST =  'http://127.0.0.1:8000';
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
    ENV.APP.DRUMSERVER_HOST = 'https://drumserver.herokuapp.com';
    // here you can enable a production-specific feature
  }

  return ENV;
};
