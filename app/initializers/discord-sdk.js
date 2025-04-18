import { patchUrlMappings } from '@discord/embedded-app-sdk';
import config from 'euclip/config/environment';

const applyProxyPrefix = () => {
  const proxyPrefix = config.APP.PROXY_PREFIX;
  config.APP.DRUMMACHINES_PROXY_PATH = `${proxyPrefix}${config.APP.DRUMMACHINES_PROXY_PATH}`;
  config.APP.API_PREFIX = `${proxyPrefix}/v1`;
};

const patchExternalUrls = () => {
  // define a mapping for the external urls
  // matching the configuration in discord developer portal
  patchUrlMappings([
    {
      prefix: config.APP.DRUMMACHINES_PROXY_PATH,
      target: config.APP.DRUMMACHINES_ROOT,
    },
  ]);
};

export function initialize() {
  const isEmbed = window.location.pathname === '/embed';
  if (isEmbed) {
    applyProxyPrefix();
    patchExternalUrls();
  }
}

export default {
  initialize,
};
