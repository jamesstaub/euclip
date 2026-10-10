import { module, test } from 'qunit';
import { setupRenderingTest } from 'euclip/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Helper | int-to-bool', function (hooks) {
  setupRenderingTest(hooks);

  test('maps truthy and falsy numbers to booleans', async function (assert) {
    this.set('value', 1);
    await render(hbs`{{if (int-to-bool this.value) "on" "off"}}`);
    assert.dom(this.element).hasText('on');

    this.set('value', 0);
    assert.dom(this.element).hasText('off');
  });
});
