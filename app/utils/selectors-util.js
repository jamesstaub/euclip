import ENV from 'euclip/config/environment';

export function selectorType(selector) {
  if (selector.startsWith('.')) {
    return 'class';
  }

  if (selector.startsWith('#')) {
    return 'id';
  }

  if (ENV.APP.supportedAudioNodes.includes(selector)) {
    return 'element';
  }

  return null;
}
