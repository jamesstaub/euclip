import { module, test } from 'qunit';
import { setupRenderingTest } from 'euclip/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | auth/button-submit', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

    await render(hbs`<Auth::ButtonSubmit />`);

    assert.dom().hasText('');

    // Template block usage:
    await render(hbs`
      <Auth::ButtonSubmit>
        template block text
      </Auth::ButtonSubmit>
    `);

    assert.dom().hasText('template block text');
  });
});
