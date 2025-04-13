import { module, test } from 'qunit';
import { setupRenderingTest } from 'euclip/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | auth/form', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

    await render(hbs`<Auth::Form />`);

    assert.dom().hasText('');

    // Template block usage:
    await render(hbs`
      <Auth::Form>
        template block text
      </Auth::Form>
    `);

    assert.dom().hasText('template block text');
  });
});
