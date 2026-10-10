import { module, test } from 'qunit';
import { setupRenderingTest } from 'euclip/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | controls/multislider', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

    await render(hbs`<Controls::Multislider />`);

    assert.dom(this.element).hasText('');

    // Template block usage:
    await render(hbs`
      <Controls::Multislider>
        template block text
      </Controls::Multislider>
    `);

    assert.dom(this.element).hasText('template block text');
  });
});
