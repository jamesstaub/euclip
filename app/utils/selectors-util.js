
import { supportedAudioNodes } from './audio-node-config';

export function selectorType(selector) {
  if (selector.startsWith('.')) {
    return 'class';
  }

  if (selector.startsWith('#')) {
    return 'id';
  }

  if (supportedAudioNodes.includes(selector)) {
    return 'element';
  }

  return null;
}
