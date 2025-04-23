import { patchUrlMappings } from '@discord/embedded-app-sdk';
import config from 'euclip/config/environment';

const applyProxyPrefix = () => {
  const proxyPrefix = config.APP.PROXY_PREFIX;
  config.APP.API_PREFIX = `${proxyPrefix}${config.APP.API_PREFIX}`;
  config.APP.ASSETS_PATH = `${proxyPrefix}${config.APP.ASSETS_PATH}`;
  config.APP.DRUMMACHINES_CDN_PATH = `${proxyPrefix}${config.APP.DRUMMACHINES_CDN_PATH}`;

  config.APP.registrationEndpoint = `${proxyPrefix}${config.APP.registrationEndpoint}`;
  config.APP.userEndpoint = `${proxyPrefix}${config.APP.userEndpoint}`;
  config.APP.invalidateEndpoint = `${proxyPrefix}${config.APP.invalidateEndpoint}`;
  
};

const patchExternalUrls = () => {
  // define a mapping for the external urls
  // matching the configuration in discord developer portal
  patchUrlMappings([
    {
      prefix: config.APP.DRUMMACHINES_PROXY_PATH,
      target: config.APP.AUDIO_CDN_ROOT,
    },
  ]);
};

export function initialize() {
  // look in query params for frame_id param 
  window.isEmbed = window.location.search.includes('frame_id');
  
  // if host is localhost
  if (window.location.hostname === 'localhost') {
    config.APP.PROXY_PREFIX = '';
  }

  if (window.isEmbed) {
    applyProxyPrefix();
    patchExternalUrls();
  } else {
    config.APP.PROXY_PREFIX = '';
  }
}

export default {
  initialize,
};
