import { module, test } from 'qunit';
import { setupRenderingTest } from 'euclip/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | button-text', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

    await render(hbs`<ButtonText />`);

    assert.dom().hasText('');

    // Template block usage:
    await render(hbs`
      <ButtonText>
        template block text
      </ButtonText>
    `);

    assert.dom().hasText('template block text');
  });
});
