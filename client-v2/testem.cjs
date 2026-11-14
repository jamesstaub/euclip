'use strict';

const { existsSync } = require('node:fs');

// Tests run in headless Chrome. On a Mac without Chrome, Brave (also Chromium) stands in.
// TESTEM_BROWSER overrides the choice with any launcher name testem knows ("Chrome", "Headless Brave", ...).
function browser() {
  if (process.env.TESTEM_BROWSER) return process.env.TESTEM_BROWSER;
  const onMac = (app) => existsSync(`/Applications/${app}.app`);
  if (
    process.platform === 'darwin' &&
    !onMac('Google Chrome') &&
    onMac('Brave Browser')
  ) {
    return 'Headless Brave';
  }
  return 'Chrome';
}

const chromiumArgs = [
  // --no-sandbox is needed when running Chrome inside a container
  process.env.CI ? '--no-sandbox' : null,
  '--headless',
  '--disable-dev-shm-usage',
  '--disable-software-rasterizer',
  '--mute-audio',
  '--remote-debugging-port=0',
  '--window-size=1440,900',
].filter(Boolean);

if (typeof module !== 'undefined') {
  module.exports = {
    test_page: 'tests/index.html?hidepassed',
    cwd: 'dist',
    disable_watching: true,
    launch_in_ci: [browser()],
    launch_in_dev: [browser()],
    browser_start_timeout: 120,
    browser_args: {
      Chrome: { ci: chromiumArgs },
      'Headless Brave': { ci: chromiumArgs },
    },
  };
}
