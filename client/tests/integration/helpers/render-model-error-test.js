import { module, test } from 'qunit';
import { setupRenderingTest } from 'euclip/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Helper | render-model-error', function (hooks) {
  setupRenderingTest(hooks);

  test('formats a JSON:API error with the offending attribute', async function (assert) {
    this.set('error', {
      title: 'Invalid attribute',
      detail: "can't be blank",
      source: { pointer: '/data/attributes/username' },
    });
    await render(hbs`{{render-model-error this.error}}`);
    assert.dom(this.element).hasText('Invalid attribute "username" can\'t be blank');
  });
});
