import { module, test } from 'qunit';
import { currentURL, visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'client-v2/tests/helpers';

module('Acceptance | shell', function (hooks) {
  setupApplicationTest(hooks);

  test('visiting / shows the app shell', async function (assert) {
    await visit('/');

    assert.strictEqual(currentURL(), '/');
    assert.dom('[data-test-app-shell]').exists();
    assert.dom('[data-test-app-header]').exists();
    assert.dom('[data-test-track-list]').exists();
    assert.dom('[data-test-track-footer]').exists();
    assert.dom('[data-test-transport]').exists();
  });

  test('the page itself never scrolls sideways', async function (assert) {
    await visit('/');

    const shell = document.querySelector('[data-test-app-shell]');
    assert.ok(shell, 'the shell is rendered');
    assert.ok(
      shell!.scrollWidth <= shell!.clientWidth,
      `shell content (${shell!.scrollWidth}px) fits its width (${shell!.clientWidth}px)`,
    );
  });
});
