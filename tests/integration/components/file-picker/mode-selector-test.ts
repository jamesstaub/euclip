import { module, test } from 'qunit';
import { setupRenderingTest } from 'euclip/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | file-picker/mode-selector', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

    await render(hbs`<FilePicker::ModeSelector />`);

    assert.dom().hasText('');

    // Template block usage:
    await render(hbs`
      <FilePicker::ModeSelector>
        template block text
      </FilePicker::ModeSelector>
    `);

    assert.dom().hasText('template block text');
  });
});
