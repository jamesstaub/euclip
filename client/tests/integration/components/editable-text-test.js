import { module, test } from 'qunit';
import { setupRenderingTest } from 'euclip/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | editable-text', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

    await render(hbs`<EditableText />`);

    assert.dom().hasText('');

    // Template block usage:
    await render(hbs`
      <EditableText>
        template block text
      </EditableText>
    `);

    assert.dom().hasText('template block text');
  });
});
