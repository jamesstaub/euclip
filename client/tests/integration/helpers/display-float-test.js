import { module, test } from 'qunit';
import { setupRenderingTest } from 'euclip/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Helper | display-float', function (hooks) {
  setupRenderingTest(hooks);

  test('rounds numbers and numeric strings to 6 decimals', async function (assert) {
    this.set('value', 1.23456789);
    await render(hbs`{{display-float this.value}}`);
    assert.dom(this.element).hasText('1.234568');

    this.set('value', '1234'); // used to throw: strings have no toFixed
    assert.dom(this.element).hasText('1234');
  });

  test('passes non-numeric values through', async function (assert) {
    this.set('value', 'abc');
    await render(hbs`{{display-float this.value}}`);
    assert.dom(this.element).hasText('abc');
  });
});
