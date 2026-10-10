import { module, test } from 'qunit';
import { setupRenderingTest } from 'euclip/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | project/ui-state', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

    await render(hbs`<Project::UiState />`);

    assert.dom().hasText('');

    // Template block usage:
    await render(hbs`
      <Project::UiState>
        template block text
      </Project::UiState>
    `);

    assert.dom().hasText('template block text');
  });
});
