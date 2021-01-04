/**
 *  Utility functions for creating and managing state of audio nodes using the cracked library.
 *  All usage of the cracked library should occur in this file to create a decoupled interface between 
 *  Euclip and Cracked.
 * 
 * 
 */


/**
 * instantiate a DAC node preceded by a compressor node.
 * 
 * All audio channels created for a project can be pointed to the compressor like
 * `__('.my-node-selector').connect("#mixer")`
 */
export function createMasterDac(id) {
  // create a compressor -> DAC node for other nodes to connect to
  __()
    .compressor({
      release: .1,
      id: 'mixer',
      class: `project-${id}`,
    })
    .dac();
}

/**
 * create the custom `channelStrip` cracked macro, which is relied upon by the Track UI
 * Tracks create channel strips, which are simply a gain node and a panner node,
 * and TrackControl records can be automatically created based off of this macros ui options.
 * This ensures all new tracks have consistent volume/pan UI
 *
 */
export function defineChannelStripMacro() {
  cracked.channelStrip = function(params = {}) {
    __.begin('channelStrip', params).gain(1).panner({ui: 'dial'}).end('channelStrip');
    return cracked;
  }
}

/**
 * start the cracked `loop` at a certain interval (ms)
 */
export function startLoop(loopInterval) {
  __.loop('start');    
  __.loop(loopInterval);
}

/**
 * stop the cracked `loop` and 
 * also stop playback of all nodes
 */
export function stopLoop() {
  __.loop('stop');    
  __('*').stop();
}

export function unbindFromSequencer(samplerSelector) {
  __(samplerSelector).unbind('step');
}


/**
 * Configuration for createing TrackControl records assigned to TrackNodes 
 * based on the supported node types in the cracked library.
 */
export function paramsForNode(nodeType) {
  switch (nodeType) {
    case 'bitcrusher':
      return ['frequency', 'bits'];
    case 'comb':
      return ['delay', 'damping', 'cutoff', 'feedback'];
    case 'delay':
      return ['delay', 'damping', 'feedback', 'cutoff', 'frequency'];
    case 'gain':
      return ['gain'];
    case 'lowpass' || 'highpass' || 'bandpass' || 'allpasss' || 'notch':
      return ['frequency', 'q'];
    case 'lowshelf' || 'highshelf' || 'peaking':
      return ['frequency', 'q', 'gain'];
    case 'lfo':
      return ['frequency', 'gain'];
    case 'overdrive':
      return ['drive', 'color', 'postCut'];
    case 'panner':
      return ['pan'];
    case 'reverb':
      return ['decay', 'reverse'];
    case 'ring':
      return ['distortion', 'frequency'];
    case 'sampler':
      return ['speed', 'start', 'end'];
    case 'sine' || 'square' || 'triangle' || 'sawtooth':
      return ['frequency', 'detune'];
    default:
      return [];
  }
}

/**
 * 
 * @param {String} attr
 * @param {String} nodeType 
 * TrackControl default value for each attribute
 */
export function defaultForAttr(attr, nodeType) {
  const paramDefaults = {};
  switch (attr) {
    case 'bits':
      paramDefaults.min = 1;
      paramDefaults.max = 16;
      paramDefaults.defaultValue = 6;
      break;
    case 'color':
      paramDefaults.min = 0;
      paramDefaults.max = 1000;
      paramDefaults.defaultValue = 800;
      break;
    case 'cutoff':
      paramDefaults.min = 0;
      paramDefaults.max = 4000;
      paramDefaults.defaultValue = 1500;
      break;
    case 'damping':
      paramDefaults.min = 0;
      paramDefaults.max = 1;
      paramDefaults.defaultValue = 0.84;
      break;
    case 'decay':
      paramDefaults.min = 0;
      paramDefaults.max = 4;
      paramDefaults.defaultValue = 0;
      break;
    case 'delay':
      paramDefaults.min = 0;
      paramDefaults.max = 6;
      paramDefaults.defaultValue = 2;
      break;
    case 'detune':
      paramDefaults.min = 0;
      paramDefaults.max = 100;
      paramDefaults.defaultValue = 0;
      break;
    case 'distortion':
      paramDefaults.min = 0;
      paramDefaults.max = 3;
      paramDefaults.defaultValue = 1;
      break;
    case 'drive':
      paramDefaults.min = 0;
      paramDefaults.max = 2;
      paramDefaults.defaultValue = .5;
      break;
    case 'end':
      paramDefaults.min = 0;
      paramDefaults.max = 1;
      paramDefaults.defaultValue = 1;
      break;
    case 'feedback':
      paramDefaults.min = 0;
      paramDefaults.max = 1;
      paramDefaults.defaultValue = 0;
      break;
    case 'frequency':
      if (nodeType === 'lfo') {
        paramDefaults.min = 0;
        paramDefaults.max = 20;
        paramDefaults.defaultValue = 5;  
      } else {
        paramDefaults.min = 0;
        paramDefaults.max = 10000;
        paramDefaults.defaultValue = 300;
      }
      break;
    case 'gain':
      paramDefaults.min = 0;
      paramDefaults.max = 1;
      paramDefaults.defaultValue = 1;
      break;
    case 'pan':
      paramDefaults.min = -1;
      paramDefaults.max = 1;
      paramDefaults.defaultValue = 0;
      break;
    case 'postCut':
      paramDefaults.min = 0;
      paramDefaults.max = 5000;
      paramDefaults.defaultValue = 3000;
      break;
    case 'q':
      paramDefaults.min = 0;
      paramDefaults.max = 20;
      paramDefaults.defaultValue = 0;
      break;
    case 'seconds':
      paramDefaults.min = 0;
      paramDefaults.max = 6;
      paramDefaults.defaultValue = 0;
      break;
    case 'speed':
      paramDefaults.min = .125;
      paramDefaults.max = 2;
      paramDefaults.defaultValue = 1; 
      break;
    case 'start':
      paramDefaults.min = 0;
      paramDefaults.max = 1;
      paramDefaults.defaultValue = 0;
      break;
  }
  return paramDefaults;
}
