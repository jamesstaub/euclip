import { module, test } from 'qunit';
import { setupRenderingTest } from 'euclip/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Helper | style-for-notification', function (hooks) {
  setupRenderingTest(hooks);

  test('returns a tachyons style per notification type', async function (assert) {
    this.set('type', 'error');
    await render(hbs`{{style-for-notification this.type}}`);
    assert.dom(this.element).hasText('bg-washed-red dark-red');

    this.set('type', 'success');
    assert.dom(this.element).hasText('bg-washed-green dark-green');

    this.set('type', 'nope');
    assert.dom(this.element).hasText('');
  });
});
