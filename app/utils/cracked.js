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