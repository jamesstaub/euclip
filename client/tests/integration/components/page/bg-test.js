import { module, test } from 'qunit';
import { setupRenderingTest } from 'euclip/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | page/bg', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

    await render(hbs`<Page::Bg />`);

    assert.dom().hasText('');

    // Template block usage:
    await render(hbs`
      <Page::Bg>
        template block text
      </Page::Bg>
    `);

    assert.dom().hasText('template block text');
  });
});
