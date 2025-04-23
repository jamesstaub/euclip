/**
 * Utility functions for creating and managing state of audio nodes using the cracked library.
 * All usage of the cracked library should occur in this file to create a decoupled interface between
 * Euclip and Cracked.
 */

declare const __: any;
declare const cracked: any;

/**
 * Get a Cracked node by UUID.
 */
export function getCrackedNode(uuid: string): any {
  return __._getNode(uuid);
}

/**
 * Create the custom `channelStrip` cracked macro, which is relied upon by the Track UI.
 * Tracks create channel strips, which are simply a gain node and a panner node,
 * and TrackControl records can be automatically created based on this macro's UI options.
 * This ensures all new tracks have consistent volume/pan UI.
 */
export function defineChannelStripMacro(): void {
  cracked.channelStrip = function (params: { gain?: number; pan?: number } = {}) {
    __.begin('channelStrip', params)
      .gain(params.gain)
      .panner(params.pan)
      .end('channelStrip');
    return __;
  };
}

/**
 * Adds a custom selector to a cracked audio node.
 *
 * @param node - The audio node to tag.
 * @param selector - The unique string identifier for the node.
 *
 * Euclip's strategy for creating IDs and classes on cracked nodes behind the scenes.
 * Relies on a customized version of Cracked that supports _setNodeLookup.
 */
export function addCustomSelector(node: any, selector: string): void {
  const existingSelectorNodes = __._getNodeLookup()[selector] || [];
  existingSelectorNodes.push(node.getUUID());

  __._setNodeLookup(selector, existingSelectorNodes);
  node.selector_array.push(selector);
}

/**
 * Start the cracked `loop` at a specified interval (in ms).
 */
export function startLoop(loopInterval: number): void {
  __.loop('start');
  __.loop(loopInterval);
  __('dac').start();
}

/**
 * Start all nodes in the cracked environment.
 */
export function startAllNodes(): void {
  __('*').start();
}

/**
 * Stop the cracked `loop` and all audio node playback.
 */
export function stopLoop(): void {
  __.loop('stop');
  __('*').stop();
  stopDelays();
}

/**
 * Reset the cracked loop to initial state.
 */
export function resetLoop(): void {
  __.loop('reset');
}

/**
 * Ramp down delay and comb filter nodes to silence.
 */
export function stopDelays(): void {
  __('delay,comb').ramp(0, 0.1, 'feedback');
  __('delay,comb').ramp(0, 0.5, 'gain');
}


/**
 * Disconnect all nodes in the cracked environment.
 */
export function disconnectAll(): void {
  __('*').unbind('step');
  __.reset();
}

/**
 * Bind a callback to be invoked on every step of the cracked loop.
 *
 * @param nodeSelector - Cracked selector string for the target node(s).
 * @param callback - The function to call each step.
 * @param array - Array passed into the callback for iteration.
 * @param options - Additional cracked loop options.
 */
export function bindToLoopStep(
  nodeSelector: string,
  callback: (...args: any[]) => void,
  array: any[],
  options?: Record<string, any>
): void {
  __(nodeSelector).bind('step', callback, array, options);
}


export function extendOnCreateNode(fn: Function): void {
  __.onCreateNode = fn;
}

/**
 * Unbind the step callback from the cracked loop for a given selector.
 *
 * @param samplerSelector - Selector string of the node to unbind.
 */
export function unbindFromSequencer(samplerSelector: string): void {
  __(samplerSelector).unbind('step');
}

/**
 * Apply attributes to a cracked audio node.
 *
 * @param selector - Cracked selector string for the node.
 * @param attrs - Object of attributes expected by the node.
 *
 * Example: { speed, start, end } for a sampler node.
 */
export function applyAttrs(selector: string, attrs: Record<string, any>): void {
  __(selector).attr(attrs);
}

/** List of available synth node types */
export const synthNodes: string[] = ['triangle', 'sine', 'square', 'saw'];

/** List of available noise node types */
export const noiseNodes: string[] = ['noise', 'pink', 'white', 'brown'];
