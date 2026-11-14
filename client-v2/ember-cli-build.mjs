import EmberApp from 'ember-cli/lib/broccoli/ember-app.js';
import { compatBuild } from '@embroider/compat';

export default async function (defaults) {
  const { buildOnce } = await import('@embroider/vite');

  const app = new EmberApp(defaults, {
    // Add options here
  });

  return compatBuild(app, buildOnce, {
    // Folders of app/ that are only ever reached by an import, never looked up by name at runtime.
    // Leaving them out of the eagerly loaded module map is what lets app/editor (the code editor and
    // CodeMirror) be a chunk of its own, loaded the first time an editor is shown.
    staticAppPaths: ['editor', 'utils', 'assets'],
  });
}
