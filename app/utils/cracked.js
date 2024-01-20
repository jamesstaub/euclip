/**
 *  Utility functions for creating and managing state of audio nodes using the cracked library.
 *  All usage of the cracked library should occur in this file to create a decoupled interface between
 *  Euclip and Cracked.
 *
 *
 */
export function getCrackedNode(uuid) {
  return __._getNode(uuid);
}

/**
 * create the custom `channelStrip` cracked macro, which is relied upon by the Track UI
 * Tracks create channel strips, which are simply a gain node and a panner node,
 * and TrackControl records can be automatically created based off of this macros ui options.
 * This ensures all new tracks have consistent volume/pan UI
 *
 */
export function defineChannelStripMacro() {
  cracked.channelStrip = function (params = {}) {
    __.begin('channelStrip', params)
      .gain(params.gain)
      .panner(params.pan)
      .end('channelStrip');
    return __;
  };
}

/**
 *
 * @param {AudioNode} node
 * @param {string} selector
 *
 * Euclip's stategy for creating ids + classess on cracked nodes behind the scenes.
 * relies on customized version of Cracked, which adds the _setNodeLookup
 *
 * for selectors to work properly in Cracked, they need to live on the audio node's selector array
 * and need to be a key in the _nodeLookup
 */
export function addCustomSelector(node, selector) {
  const existingSelectorNodes = __._getNodeLookup()[selector] || [];
  existingSelectorNodes.push(node.getUUID());

  __._setNodeLookup(selector, existingSelectorNodes);
  node.selector_array.push(selector);
}

/**
 * start the cracked `loop` at a certain interval (ms)
 */
export function startLoop(loopInterval) {
  __.loop('start');
  __.loop(loopInterval);
  __('dac').start();
}

export function startAllNodes() {
  __('*').start();
}

/**
 * stop the cracked `loop` and
 * also stop playback of all nodes
 */
export function stopLoop() {
  __.loop('stop');
  __('*').stop();
  stopDelays();
}

export function resetLoop() {
  __.loop('reset');
}

export function stopDelays() {
  __('delay,comb').ramp(0, 0.1, 'feedback');
  __('delay,comb').ramp(0, 0.5, 'gain');
}

/**
 *
 * @param {String: cracked selector} nodeSelector
 * @param {Function } callback
 * @param {Array} array
 *
 * The cracked __.loop is the main sequencer that Euclip binds track scripts to
 */
export function bindToLoopStep(nodeSelector, callback, array, options) {
  __(nodeSelector).bind(
    'step', // on every crack sequencer step
    callback, // call this function (bound to component scope)
    array, // passing in array value at position,
    options
  );
}

export function unbindFromSequencer(samplerSelector) {
  __(samplerSelector).unbind('step');
}

// attrs is an object of attributes that a audio node expects like
// {speed, start, end} for a sampler node.
// improve this by adding validations for the nodeType
export function applyAttrs(selector, attrs) {
  __(selector).attr(attrs);
}

export const synthNodes = ['triangle', 'sine', 'square', 'saw'];
export const noiseNodes = ['noise', 'pink', 'white', 'brown'];
