import { module, test } from 'qunit';
import { setupRenderingTest } from 'euclip/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | page/wrapper', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

    await render(hbs`<Page::Wrapper />`);

    assert.dom().hasText('');

    // Template block usage:
    await render(hbs`
      <Page::Wrapper>
        template block text
      </Page::Wrapper>
    `);

    assert.dom().hasText('template block text');
  });
});
