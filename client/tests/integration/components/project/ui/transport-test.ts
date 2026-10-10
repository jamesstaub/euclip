import { module, test } from 'qunit';
import { setupRenderingTest } from 'euclip/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | project/ui/transport', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

    await render(hbs`<Project::Ui::Transport />`);

    assert.dom().hasText('');

    // Template block usage:
    await render(hbs`
      <Project::Ui::Transport>
        template block text
      </Project::Ui::Transport>
    `);

    assert.dom().hasText('template block text');
  });
});
