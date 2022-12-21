import { module, test } from 'qunit';
import { setupRenderingTest } from 'euclip/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module(
  'Integration | Component | file-search-result-directory',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders', async function (assert) {
      // Set any properties with this.set('myProperty', 'value');
      // Handle any actions with this.set('myAction', function(val) { ... });

      await render(hbs`<FileSearchResultDirectory />`);

      assert.dom(this.element).hasText('');

      // Template block usage:
      await render(hbs`
      <FileSearchResultDirectory>
        template block text
      </FileSearchResultDirectory>
    `);

      assert.dom(this.element).hasText('template block text');
    });
  }
);
