import { module, test } from 'qunit';
import { setupRenderingTest } from 'euclip/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | auth/input', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

    await render(hbs`<Auth::Input />`);

    assert.dom().hasText('');

    // Template block usage:
    await render(hbs`
      <Auth::Input>
        template block text
      </Auth::Input>
    `);

    assert.dom().hasText('template block text');
  });
});
