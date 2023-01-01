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

      // nodes defined in cracked library that euclip supports for TrackNodes and TrackControls
      supportedAudioNodes: [
        'allpasss',
        'bandpass',
        'bitcrusher',
        'channelStrip',
        'comb',
        'compressor',
        'delay',
        'gain',
        'highpass',
        'highshelf',
        'lfo',
        'lowshelf',
        'lowpass',
        'notch',
        'overdrive',
        'panner',
        'peaking',
        'reverb',
        'ring',
        'sampler',
        'sine',
        'square',
        'sawtooth',
        'triangle',
      ],

      // JSON API include? query param string of related models for calls to projects endpoint
      projectIncludeParams:
        'creator,tracks,tracks.sequences,tracks.track-controls,tracks.init-script,tracks.onstep-script',
      trackIncludeParams: 'project,sequences,init-script,onstep-script',
    },
  };

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    ENV.APP.DRUMSERVER_HOST = 'http://127.0.0.1:8000';
    ENV.APP.AUDIO_PATH = '/assets/audio/Drum%20Machines%20mp3';
    // ENV.APP.DRUMSERVER_HOST = 'https://drumserver.herokuapp.com';
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
    ENV.APP.AUDIO_PATH =
      'https://storage.googleapis.com/euclidean-cracked.appspot.com/Drum%20Machines%20mp3';
  }

  return ENV;
};
